import { Injectable, BadRequestException } from '@nestjs/common';
import { AIConfigService } from '../config/ai.config';
import axios, { AxiosError } from 'axios';
import { nanoid } from 'nanoid';
import { OpenAICompatibleProvider } from './providers/openai-compatible.provider';
import type {
  ChatCompletionResponse,
  ChatCompletionStreamChunk,
  OpenAICompatibleApiError,
} from './providers/openai-compatible.types';
import {
  buildQuestionGenerationPrompt,
  buildQuestionGenerationStreamPrompt,
} from './prompts/question-generation.prompts';

/**
 * Node.js Readable 的最小形状（只用到 .on）。
 *
 * 说明：在 TS 类型层面，我们不强依赖 node:stream 的具体类型，
 * 避免不同 axios/stream 定义差异导致类型拉扯。
 */
type ReadableStreamLike = {
  on: (event: string, listener: (...args: any[]) => void) => unknown;
};

function isReadableStreamLike(value: unknown): value is ReadableStreamLike {
  if (typeof value !== 'object' || value == null) return false;
  return typeof (value as Record<string, unknown>).on === 'function';
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value == null) return null;
  return value as Record<string, unknown>;
}

/**
 * AI生成问卷请求接口
 * @interface AIGenerateQuestionRequest
 * @property {string} prompt - 用户的自然语言描述
 */
export interface AIGenerateQuestionRequest {
  prompt: string;
}

/**
 * AI生成问卷响应接口
 * @interface AIGenerateQuestionResponse
 * @property {Object} pageInfo - 问卷页面信息
 * @property {string} pageInfo.title - 问卷标题
 * @property {string} [pageInfo.desc] - 问卷描述
 * @property {string} [pageInfo.js] - JavaScript代码
 * @property {string} [pageInfo.css] - CSS样式
 * @property {boolean} [pageInfo.isPublished] - 是否发布
 * @property {Array} componentList - 组件列表
 */
export interface AIGenerateQuestionResponse {
  pageInfo: {
    title: string;
    desc?: string;
    js?: string;
    css?: string;
    isPublished?: boolean;
  };
  componentList: Array<{
    fe_id: string; // 前端组件ID
    type: string; // 组件类型
    title: string; // 组件标题
    isHidden?: boolean; // 是否隐藏
    isLocked?: boolean; // 是否锁定
    props: Record<string, unknown>; // 组件属性
  }>;
}

export type AIGenerateStreamEventType =
  | 'meta'
  | 'assistant_delta'
  | 'page_info'
  | 'component'
  | 'done'
  | 'error'
  | 'ping';

export type AIGenerateStreamEvent =
  | {
      type: 'assistant_delta';
      data: { textDelta: string };
    }
  | {
      type: 'page_info';
      data: AIGenerateQuestionResponse['pageInfo'];
    }
  | {
      type: 'component';
      data: AIGenerateQuestionResponse['componentList'][number];
    }
  | {
      type: 'done';
      data: { ok: true };
    }
  | {
      type: 'error';
      data: { message: string; code?: string };
    };

export interface AIGenerateStreamHandlers {
  onEvent: (eventName: AIGenerateStreamEventType, payload: unknown) => void;
  onClose?: () => void;
}

const ALLOWED_COMPONENT_TYPES = new Set([
  'questionInfo',
  'questionTitle',
  'questionParagraph',
  'questionInput',
  'questionTextarea',
  'questionRadio',
  'questionCheckbox',
]);

const MAX_COMPONENTS = 50;
const MAX_TITLE_LEN = 80;
const MAX_DESC_LEN = 300;
const MAX_TEXT_DELTA_LEN = 2000;

@Injectable()
/**
 * AI服务类
 * 负责调用 OpenAI-compatible Chat Completions API，将自然语言描述转换为问卷结构。
 *
 * 本服务做三件事：
 * 1) 组织提示词（prompt），约束模型输出格式
 * 2) 调用上游模型（非流式/流式）
 * 3) 对 AI 输出做“防御性清洗”（sanitize），确保写入/返回的数据满足前端 schema
 */
export class AIService {
  /** 当前生效的 AI 配置（从环境变量加载） */
  private readonly config: ReturnType<AIConfigService['getConfig']>; // AI配置

  /** OpenAI-compatible Provider（可对接通义兼容模式 / DeepSeek / OpenAI 等） */
  private readonly provider: OpenAICompatibleProvider;

  /**
   * 构造函数
   * @param aiConfigService - AI配置服务
   */
  constructor(private readonly aiConfigService: AIConfigService) {
    this.config = this.aiConfigService.getConfig(); // 获取AI配置

    // Provider：上层通过 AI_PROVIDER + AI_API_URL + AI_MODEL 切换。
    this.provider = new OpenAICompatibleProvider({
      apiKey: this.config.apiKey,
      baseUrl: this.config.baseUrl,
      chatCompletionsPath: this.config.chatCompletionsPath,
      timeoutMs: this.config.timeoutMs,
    });
  }

  /**
   * 流式生成：把上游 SSE token 流解析为 JSON Lines 事件，并通过 handlers 逐个输出。
   *
   * 数据通路：
   * - 上游（OpenAI-compatible）以 SSE 帧返回：data: {choices:[{delta:{content}}]}\n\n
   * - 我们把增量 content 当成“JSONL 文本流”，累积到 jsonlBuffer
   * - 再按 \n 切行逐行 JSON.parse，得到 {type,data}
   * - 最终把事件透传给 QuestionController 的 SSE 输出
   */
  async generateQuestionStream(
    request: AIGenerateQuestionRequest,
    handlers: AIGenerateStreamHandlers,
    signal?: AbortSignal,
  ): Promise<void> {
    const { prompt } = request;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new BadRequestException('prompt 不能为空');
    }
    if (prompt.length > 2000) {
      throw new BadRequestException('prompt 长度不能超过2000字符');
    }

    const systemPrompt =
      '你是一个专业的问卷生成助手。你的输出必须严格符合 JSON Lines（JSONL）协议，每一行都是 JSON。';

    // meta 事件（后端本地生成）：方便前端/日志定位一次请求
    handlers.onEvent('meta', {
      requestId: nanoid(),
      provider: this.config.provider,
      model: this.config.model,
      startedAt: new Date().toISOString(),
    });

    try {
      const stream: unknown = await this.provider.createChatCompletionStream({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: buildQuestionGenerationStreamPrompt(prompt),
          },
        ],
        temperature: this.config.temperature,
        maxTokens: this.config.maxTokens,
        signal,
      });
      if (!isReadableStreamLike(stream)) {
        throw new BadRequestException('AI 流式响应不可用');
      }

      let upstreamBuffer = '';
      let jsonlBuffer = '';
      let componentCount = 0;
      let doneEmitted = false;

      /**
       * 统一的事件出口：在这里做限流/裁剪/计数。
       * 注意：这里的 handlers.onEvent 最终会写入 SSE，所以要避免输出过大的 payload。
       */
      const emitParsedEvent = (event: AIGenerateStreamEvent) => {
        if (event.type === 'assistant_delta') {
          const textDelta = event.data.textDelta;
          if (typeof textDelta !== 'string' || textDelta.length === 0) return;
          handlers.onEvent('assistant_delta', {
            textDelta: textDelta.slice(0, MAX_TEXT_DELTA_LEN),
          });
          return;
        }

        if (event.type === 'page_info') {
          handlers.onEvent('page_info', event.data);
          return;
        }

        if (event.type === 'component') {
          if (componentCount >= MAX_COMPONENTS) return;
          componentCount += 1;
          handlers.onEvent('component', event.data);
          return;
        }

        if (event.type === 'done') {
          if (doneEmitted) return;
          doneEmitted = true;
          handlers.onEvent('done', { ok: true });
          return;
        }

        if (event.type === 'error') {
          handlers.onEvent('error', event.data);
        }
      };

      /**
       * 将上游返回的增量文本当作 JSONL（每行一个 JSON 对象）进行解析。
       *
       * 关键点：上游 token 可能把同一行 JSON 切成多段，所以必须先累积到 buffer，
       * 只有遇到换行符 \n 才尝试 parse。
       */
      const tryParseJsonlLines = (deltaText: string) => {
        jsonlBuffer += deltaText;

        // 按行解析（\n）
        while (true) {
          const lineBreakIndex = jsonlBuffer.indexOf('\n');
          if (lineBreakIndex < 0) break;

          const rawLine = jsonlBuffer.slice(0, lineBreakIndex);
          jsonlBuffer = jsonlBuffer.slice(lineBreakIndex + 1);

          const line = rawLine.trim();
          if (!line) continue;

          let parsed: unknown;
          try {
            parsed = JSON.parse(line) as unknown;
          } catch {
            // 可能是“带换行的残缺 JSON”，放回去等待更多 token
            jsonlBuffer = rawLine + '\n' + jsonlBuffer;
            break;
          }

          if (typeof parsed !== 'object' || parsed == null) continue;
          const record = parsed as Record<string, unknown>;
          const type = record.type;
          const data = record.data;
          if (typeof type !== 'string') continue;

          if (type === 'assistant_delta') {
            const dataRecord = asRecord(data) ?? {};
            const textDelta =
              typeof dataRecord.textDelta === 'string'
                ? dataRecord.textDelta
                : '';
            emitParsedEvent({ type: 'assistant_delta', data: { textDelta } });
            continue;
          }

          if (type === 'page_info') {
            const pageInfo = this.sanitizePageInfo(data);
            if (pageInfo)
              emitParsedEvent({ type: 'page_info', data: pageInfo });
            continue;
          }

          if (type === 'component') {
            const component = this.sanitizeComponent(data);
            if (component) {
              emitParsedEvent({ type: 'component', data: component });
            }
            continue;
          }

          if (type === 'done') {
            emitParsedEvent({ type: 'done', data: { ok: true } });
            continue;
          }

          if (type === 'error') {
            const dataRecord = asRecord(data) ?? {};
            const message =
              typeof dataRecord.message === 'string'
                ? dataRecord.message
                : 'AI 生成失败';
            const code =
              typeof dataRecord.code === 'string' ? dataRecord.code : undefined;
            emitParsedEvent({ type: 'error', data: { message, code } });
            continue;
          }
        }
      };

      /**
       * 解析上游的 SSE 帧（OpenAI-compatible）：按 \n\n 分帧，取每行的 data:。
       */
      const parseUpstreamSse = (chunkText: string) => {
        upstreamBuffer += chunkText.replace(/\r\n/g, '\n');

        // OpenAI 风格 SSE：按 \n\n 分帧
        while (true) {
          const frameIndex = upstreamBuffer.indexOf('\n\n');
          if (frameIndex < 0) break;

          const frame = upstreamBuffer.slice(0, frameIndex);
          upstreamBuffer = upstreamBuffer.slice(frameIndex + 2);

          const lines = frame.split('\n');
          for (const l of lines) {
            const line = l.trim();
            if (!line.startsWith('data:')) continue;

            const dataStr = line.slice('data:'.length).trim();
            if (!dataStr) continue;
            if (dataStr === '[DONE]') {
              emitParsedEvent({ type: 'done', data: { ok: true } });
              return;
            }

            let parsedChunk: ChatCompletionStreamChunk | null = null;
            try {
              parsedChunk = JSON.parse(dataStr) as ChatCompletionStreamChunk;
            } catch {
              continue;
            }

            const delta = parsedChunk?.choices?.[0]?.delta?.content;
            if (typeof delta !== 'string' || delta.length === 0) continue;

            // 解析 JSON Lines 事件
            tryParseJsonlLines(delta);
          }
        }
      };

      await new Promise<void>((resolve, reject) => {
        stream.on('data', (buf: Buffer) => {
          if (doneEmitted) return;
          parseUpstreamSse(buf.toString('utf8'));
        });
        stream.on('end', () => resolve());
        stream.on('error', (err: unknown) =>
          reject(err instanceof Error ? err : new Error(String(err))),
        );
      });

      if (!doneEmitted && !signal?.aborted) {
        handlers.onEvent('done', { ok: true });
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<OpenAICompatibleApiError>;
        const statusCode = axiosError.response?.status;
        const errorData = axiosError.response?.data;
        const errorMessage =
          (errorData?.error?.message &&
          typeof errorData.error.message === 'string'
            ? errorData.error.message
            : null) || axiosError.message;

        const message =
          statusCode === 401
            ? 'AI API 密钥无效，请检查配置'
            : statusCode === 429
              ? 'AI API 请求频率过高，请稍后重试'
              : statusCode === 500
                ? 'AI 服务暂时不可用，请稍后重试'
                : `AI 服务调用失败: ${typeof errorMessage === 'string' ? errorMessage : '未知错误'}`;

        handlers.onEvent('error', { message });
        return;
      }

      // 主动取消（前端断开/Abort）时不再抛出业务错误
      if (signal?.aborted) {
        handlers.onClose?.();
        return;
      }

      handlers.onEvent('error', {
        message: `生成问卷失败: ${error instanceof Error ? error.message : '未知错误'}`,
      });
    }
  }

  private sanitizePageInfo(
    input: unknown,
  ): AIGenerateQuestionResponse['pageInfo'] | null {
    if (typeof input !== 'object' || input == null) return null;
    const record = input as Record<string, unknown>;

    const title = typeof record.title === 'string' ? record.title.trim() : '';
    if (!title) return null;

    const desc = typeof record.desc === 'string' ? record.desc.trim() : '';
    const js = typeof record.js === 'string' ? record.js : '';
    const css = typeof record.css === 'string' ? record.css : '';
    const isPublished =
      typeof record.isPublished === 'boolean' ? record.isPublished : false;

    return {
      title: title.slice(0, MAX_TITLE_LEN),
      desc: desc ? desc.slice(0, MAX_DESC_LEN) : undefined,
      js,
      css,
      isPublished,
    };
  }

  private sanitizeComponent(
    input: unknown,
  ): AIGenerateQuestionResponse['componentList'][number] | null {
    if (typeof input !== 'object' || input == null) return null;
    const record = input as Record<string, unknown>;

    const type = typeof record.type === 'string' ? record.type : '';
    if (!ALLOWED_COMPONENT_TYPES.has(type)) return null;

    const title = typeof record.title === 'string' ? record.title.trim() : '';
    if (!title) return null;

    let fe_id = typeof record.fe_id === 'string' ? record.fe_id : '';
    if (!fe_id || fe_id.length < 5) fe_id = nanoid();

    const isHidden =
      typeof record.isHidden === 'boolean' ? record.isHidden : false;
    const isLocked =
      typeof record.isLocked === 'boolean' ? record.isLocked : false;

    const props =
      typeof record.props === 'object' && record.props != null
        ? (record.props as Record<string, unknown>)
        : {};

    // 统一 options
    if (
      type === 'questionCheckbox' &&
      Array.isArray(props.list) &&
      typeof props.options === 'undefined'
    ) {
      props.options = props.list;
      delete props.list;
    }
    if (
      (type === 'questionRadio' || type === 'questionCheckbox') &&
      typeof props.options !== 'undefined'
    ) {
      if (!Array.isArray(props.options)) props.options = [];
    }

    return {
      fe_id,
      type,
      title: title.slice(0, MAX_TITLE_LEN),
      isHidden,
      isLocked,
      props,
    };
  }

  /**
   * 调用 OpenAI-compatible Chat Completions API 生成问卷结构
   * @param request - AI生成问卷请求
   * @returns 生成的问卷结构
   * @throws BadRequestException - 当请求参数无效或API调用失败时
   */
  async generateQuestion(
    request: AIGenerateQuestionRequest,
  ): Promise<AIGenerateQuestionResponse> {
    const { prompt } = request;

    // 参数验证：prompt不能为空
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new BadRequestException('prompt 不能为空');
    }

    // 参数验证：prompt长度不能超过2000字符
    if (prompt.length > 2000) {
      throw new BadRequestException('prompt 长度不能超过2000字符');
    }

    try {
      // 系统提示词，指导AI生成符合规范的问卷结构
      const systemPrompt = `你是一个专业的问卷设计助手。你的任务是根据用户的自然语言描述，生成符合规范的问卷JSON结构。请确保返回的JSON格式完全正确，可以直接被解析。`;

      const responseData: ChatCompletionResponse =
        await this.provider.createChatCompletion({
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: buildQuestionGenerationPrompt(prompt),
            },
          ],
          temperature: this.config.temperature,
          maxTokens: this.config.maxTokens,
        });

      // 验证API响应是否有效
      if (!responseData?.choices?.[0]?.message?.content) {
        throw new BadRequestException('AI 返回内容为空');
      }

      const content = responseData.choices[0].message.content;
      if (typeof content !== 'string') {
        throw new BadRequestException('AI 返回内容格式不正确');
      }

      // 清理返回内容，移除可能的 markdown 代码块标记
      let cleanedContent: string = content.trim();
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent
          .replace(/^```json\s*/, '')
          .replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent
          .replace(/^```\s*/, '')
          .replace(/\s*```$/, '');
      }

      // 解析 JSON
      let parsedData: unknown;
      try {
        parsedData = JSON.parse(cleanedContent) as unknown;
      } catch (parseError) {
        throw new BadRequestException(
          `AI 返回的 JSON 格式错误: ${parseError instanceof Error ? parseError.message : '未知错误'}`,
        );
      }

      // 验证和清洗数据，确保符合规范
      return this.validateAndSanitizeResponse(parsedData);
    } catch (error) {
      // 处理Axios错误
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<OpenAICompatibleApiError>;
        const statusCode = axiosError.response?.status;
        const errorData = axiosError.response?.data;
        const errorMessage =
          (errorData?.error?.message &&
          typeof errorData.error.message === 'string'
            ? errorData.error.message
            : null) || axiosError.message;

        // 根据不同的HTTP状态码，返回不同的错误信息
        if (statusCode === 401) {
          throw new BadRequestException('AI API 密钥无效，请检查配置');
        } else if (statusCode === 429) {
          throw new BadRequestException('AI API 请求频率过高，请稍后重试');
        } else if (statusCode === 500) {
          throw new BadRequestException('AI 服务暂时不可用，请稍后重试');
        } else {
          throw new BadRequestException(
            `AI 服务调用失败: ${typeof errorMessage === 'string' ? errorMessage : '未知错误'}`,
          );
        }
      }

      // 如果是BadRequestException，直接抛出
      if (error instanceof BadRequestException) {
        throw error;
      }

      // 其他错误，统一处理
      throw new BadRequestException(
        `生成问卷失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
    }
  }

  /**
   * 验证和清洗 AI 返回的数据
   * @param data - AI返回的原始数据
   * @returns 验证和清洗后的问卷结构
   * @throws BadRequestException - 当数据格式不符合规范时
   */
  private validateAndSanitizeResponse(
    data: unknown,
  ): AIGenerateQuestionResponse {
    if (typeof data !== 'object' || data === null) {
      throw new BadRequestException('AI 返回的数据格式不正确');
    }

    const record = data as Record<string, unknown>;

    const pageInfo = this.sanitizePageInfo(record.pageInfo);
    if (!pageInfo) {
      throw new BadRequestException('AI 返回的数据 pageInfo 无效');
    }

    if (!Array.isArray(record.componentList)) {
      throw new BadRequestException('AI 返回的数据 componentList 必须是数组');
    }

    const componentList = record.componentList
      .map((component: unknown) => this.sanitizeComponent(component))
      .filter(Boolean)
      .slice(0, MAX_COMPONENTS) as AIGenerateQuestionResponse['componentList'];

    if (componentList.length === 0) {
      throw new BadRequestException('AI 返回的问卷至少需要包含一个组件');
    }

    return {
      pageInfo,
      componentList,
    };
  }
}
