import { Injectable, BadRequestException } from '@nestjs/common';
import { AIConfigService } from '../config/ai.config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { nanoid } from 'nanoid';
import type { Readable } from 'node:stream';

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

// DeepSeek API 消息类型定义
interface DeepSeekMessage {
  role: string; // 角色：system, user, assistant
  content: string; // 消息内容
}

// DeepSeek API 选择项类型定义
interface DeepSeekChoice {
  message: DeepSeekMessage; // 消息内容
  finish_reason?: string; // 结束原因
  index?: number; // 索引
}

// DeepSeek API 响应类型定义
interface DeepSeekApiResponse {
  id?: string; // 响应ID
  object?: string; // 对象类型
  created?: number; // 创建时间戳
  model?: string; // 使用的模型
  choices?: DeepSeekChoice[]; // 选择项列表
  usage?: {
    prompt_tokens?: number; // 提示词token数
    completion_tokens?: number; // 完成token数
    total_tokens?: number; // 总token数
  };
}

// DeepSeek/OpenAI 兼容的流式增量响应结构（只定义我们用到的字段）
interface DeepSeekStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string;
      role?: string;
    };
    finish_reason?: string | null;
    index?: number;
  }>;
}

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

// DeepSeek API 错误类型定义
interface DeepSeekApiError {
  error?: {
    message?: string; // 错误信息
    type?: string; // 错误类型
    code?: string; // 错误代码
  };
}

@Injectable()
/**
 * AI服务类
 * 负责调用DeepSeek API，将自然语言描述转换为问卷结构
 */
export class AIService {
  private readonly axiosInstance: AxiosInstance; // Axios实例，用于调用AI API
  private readonly config: ReturnType<AIConfigService['getConfig']>; // AI配置

  /**
   * 构造函数
   * @param aiConfigService - AI配置服务
   */
  constructor(private readonly aiConfigService: AIConfigService) {
    this.config = this.aiConfigService.getConfig(); // 获取AI配置

    // 创建Axios实例，配置AI API请求
    this.axiosInstance = axios.create({
      baseURL: this.config.apiUrl.replace('/v1/chat/completions', ''), // 基础URL
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`, // API密钥
      },
      timeout: 60000, // 60秒超时
    });
  }

  /**
   * 生成问卷结构的提示词
   * @param userPrompt - 用户的自然语言描述
   * @returns 格式化后的提示词
   */
  private getQuestionGenerationPrompt(userPrompt: string): string {
    return `你是一个问卷设计专家。请根据用户的自然语言描述，生成符合以下JSON格式的问卷结构。

问卷字段说明：
- pageInfo: 问卷页面信息
    - title: 问卷标题（必填，根据用户描述生成合适的标题）
    - desc: 问卷描述（可选，简要说明问卷的目的）
    - js: JavaScript代码（可选，通常为空字符串）
    - css: CSS样式（可选，通常为空字符串）
    - isPublished: 是否发布（可选，默认为false）
- componentList: 组件列表，每个组件包含：
    - fe_id: 唯一ID（生成随机字符串，使用nanoid格式，长度约10-15字符）
    - type: 组件类型，可选值：
        - questionInput: 单行输入框
        - questionTextarea: 多行输入框
        - questionTitle: 标题
        - questionParagraph: 段落文本
        - questionInfo: 信息展示
        - questionRadio: 单选题
        - questionCheckbox: 多选题
    - title: 组件标题（必填）
    - isHidden: 是否隐藏（可选，默认为false）
    - isLocked: 是否锁定（可选，默认为false）
    - props: 组件属性（根据组件类型不同而不同）
        - 对于 questionInput: { placeholder?: string, title?: string }
        - 对于 questionTextarea: { placeholder?: string, title?: string }
        - 对于 questionTitle: { text?: string, level?: number }
        - 对于 questionParagraph: { text?: string }
        - 对于 questionInfo: { title?: string, desc?: string }
        - 对于 questionRadio: { title?: string, options?: Array<{ text: string, value: string }>, value?: string }
        - 对于 questionCheckbox: { title?: string, options?: Array<{ text: string, value: string, checked?: boolean }> }

请将用户的描述转换为JSON格式，确保数据完整和格式正确。只返回JSON，不要包含任何其他文本或markdown代码块标记。

用户描述：${userPrompt}

请生成问卷结构：`;
  }

  /**
   * 生成流式（JSON Lines）协议的提示词：每行一个 JSON 对象 { type, data }
   * - assistant_delta：用于对话区展示
   * - page_info/component：用于结构化预览
   */
  private getQuestionGenerationStreamPrompt(userPrompt: string): string {
    return `你是一个问卷生成器。

你必须严格输出 JSON Lines：每一行都是一个完整 JSON 对象，禁止输出 markdown，禁止输出任何额外解释文本。

允许输出的事件类型只有：
- assistant_delta: {"type":"assistant_delta","data":{"textDelta":"..."}}
- page_info: {"type":"page_info","data":{"title":"...","desc":"...","js":"","css":"","isPublished":false}}
- component: {"type":"component","data":{"fe_id":"可选","type":"...","title":"...","isHidden":false,"isLocked":false,"props":{}}}
- done: {"type":"done","data":{}}

组件类型 type 只能从下列列表中选择：
- questionInfo
- questionTitle
- questionParagraph
- questionInput
- questionTextarea
- questionRadio
- questionCheckbox

要求：
1) 最少输出 1 行 page_info。
2) 至少输出 1 个 component。
3) component.props 必须是对象。
4) questionRadio/questionCheckbox 的 props.options 必须是数组：[{"text":"选项","value":"1"}]
5) js/css 默认输出空字符串。
6) 输出过程中可以多次输出 assistant_delta，用于描述你正在生成什么（给用户看的自然语言）。
7) 最后一行必须输出 done。

用户需求：${userPrompt}
`;
  }

  /**
   * DeepSeek 流式生成：把上游 token 流解析为 JSON Lines 事件，并通过 handlers 逐个输出。
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
      '你是一个专业的问卷生成助手。你的输出必须严格符合 JSON Lines 协议，每一行都是 JSON。';

    // meta 事件（后端本地生成）
    handlers.onEvent('meta', {
      requestId: nanoid(),
      model: this.config.model,
      startedAt: new Date().toISOString(),
    });

    try {
      const response = await this.axiosInstance.post<Readable>(
        '/v1/chat/completions',
        {
          model: this.config.model,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: this.getQuestionGenerationStreamPrompt(prompt),
            },
          ],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        },
        {
          responseType: 'stream',
          signal,
        },
      );

      const stream: unknown = response.data;
      if (!isReadableStreamLike(stream)) {
        throw new BadRequestException('AI 流式响应不可用');
      }

      let upstreamBuffer = '';
      let jsonlBuffer = '';
      let componentCount = 0;
      let doneEmitted = false;

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

      const parseUpstreamSse = (chunkText: string) => {
        upstreamBuffer += chunkText;

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

            let parsedChunk: DeepSeekStreamChunk | null = null;
            try {
              parsedChunk = JSON.parse(dataStr) as DeepSeekStreamChunk;
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
        const axiosError = error as AxiosError<DeepSeekApiError>;
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
   * 调用 DeepSeek API 生成问卷结构
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

      // 调用DeepSeek API
      const response = await this.axiosInstance.post<DeepSeekApiResponse>(
        '/v1/chat/completions',
        {
          model: this.config.model, // 使用的模型
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: this.getQuestionGenerationPrompt(prompt), // 用户提示词
            },
          ],
          temperature: this.config.temperature, // 温度参数，控制生成结果的随机性
          max_tokens: this.config.maxTokens, // 最大token数
        },
      );

      console.log('AI 原始响应:', response.data);

      const responseData = response.data;
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
        const axiosError = error as AxiosError<DeepSeekApiError>;
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
    // 验证数据类型：必须是对象且不为null
    if (typeof data !== 'object' || data === null) {
      throw new BadRequestException('AI 返回的数据格式不正确');
    }

    const record = data as Record<string, unknown>;

    // 验证pageInfo：必须存在且是对象
    if (!record.pageInfo || typeof record.pageInfo !== 'object') {
      throw new BadRequestException('AI 返回的数据缺少 pageInfo');
    }

    const pageInfo = record.pageInfo as Record<string, unknown>;
    // 验证pageInfo.title：必须是字符串且不为空
    if (typeof pageInfo.title !== 'string' || !pageInfo.title.trim()) {
      throw new BadRequestException('AI 返回的数据 pageInfo.title 无效');
    }

    // 验证componentList：必须是数组
    if (!Array.isArray(record.componentList)) {
      throw new BadRequestException('AI 返回的数据 componentList 必须是数组');
    }

    // 清洗和验证组件列表
    const componentList = record.componentList
      .map((component: unknown) => {
        // 过滤无效组件
        if (typeof component !== 'object' || component === null) {
          return null;
        }

        const comp = component as Record<string, unknown>;

        // 验证组件必需字段：type
        if (typeof comp.type !== 'string' || !comp.type) {
          return null;
        }

        // 验证组件必需字段：title
        if (typeof comp.title !== 'string' || !comp.title) {
          return null;
        }

        // 生成或验证fe_id：如果缺失或无效，则使用nanoid生成
        let fe_id = typeof comp.fe_id === 'string' ? comp.fe_id : '';
        if (!fe_id || fe_id.length < 5) {
          fe_id = nanoid();
        }

        // 处理组件props，初始化props对象
        let props =
          typeof comp.props === 'object' && comp.props !== null
            ? (comp.props as Record<string, unknown>)
            : {};

        // 转换逻辑：如果是多选框且存在list字段，则将其转换为options
        // 解决AI可能返回旧格式的问题
        if (comp.type === 'questionCheckbox' && props.list && !props.options) {
          props = {
            ...props,
            options: props.list, // 将list转换为options
            list: undefined, // 移除旧的list字段
          };
        }

        // 统一单选框和多选框的选项格式
        if (
          (comp.type === 'questionRadio' || comp.type === 'questionCheckbox') &&
          props.options
        ) {
          // 确保options是数组
          if (!Array.isArray(props.options)) {
            props.options = [];
          }
        }

        // 返回清洗后的组件数据
        return {
          fe_id,
          type: comp.type,
          title: comp.title,
          isHidden: typeof comp.isHidden === 'boolean' ? comp.isHidden : false, // 默认为false
          isLocked: typeof comp.isLocked === 'boolean' ? comp.isLocked : false, // 默认为false
          props,
        };
      })
      .filter(
        (comp) => comp !== null, // 过滤掉null值，保留有效的组件
      ) as AIGenerateQuestionResponse['componentList'];

    // 验证组件列表：至少包含一个组件
    if (componentList.length === 0) {
      throw new BadRequestException('AI 返回的问卷至少需要包含一个组件');
    }

    // 返回验证和清洗后的问卷结构
    return {
      pageInfo: {
        title: pageInfo.title, // 问卷标题
        desc: typeof pageInfo.desc === 'string' ? pageInfo.desc : undefined, // 问卷描述
        js: typeof pageInfo.js === 'string' ? pageInfo.js : undefined, // JavaScript代码
        css: typeof pageInfo.css === 'string' ? pageInfo.css : undefined, // CSS样式
        isPublished:
          typeof pageInfo.isPublished === 'boolean'
            ? pageInfo.isPublished
            : false, // 是否发布，默认为false
      },
      componentList, // 组件列表
    };
  }
}
