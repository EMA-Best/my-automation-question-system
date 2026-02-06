import axios, { AxiosError, AxiosInstance } from 'axios';
import type { Readable } from 'node:stream';
import type {
  ChatCompletionResponse,
  ChatMessage,
  OpenAICompatibleApiError,
} from './openai-compatible.types';

/**
 * OpenAI-compatible Provider
 *
 * 目的：把“各家 OpenAI-compatible 的 Chat Completions API”封装成一个统一调用入口。
 * - DeepSeek / 通义兼容模式 / OpenAI / 其他厂商：只要兼容 /chat/completions 即可接入
 * - 上层只关心 messages/model/temperature/max_tokens，不关心 baseUrl/path/重试细节
 */
export interface OpenAICompatibleProviderConfig {
  /** API Key（通常为 Bearer Token） */
  apiKey: string;
  /** Axios baseURL（可以包含路径前缀，例如 https://dashscope.aliyuncs.com/compatible-mode/v1） */
  baseUrl: string;
  /** Chat Completions 路径（例如 /chat/completions 或 /v1/chat/completions） */
  chatCompletionsPath: string;
  /** 请求超时（毫秒） */
  timeoutMs: number;
}

export class OpenAICompatibleProvider {
  private readonly axios: AxiosInstance;
  private readonly config: OpenAICompatibleProviderConfig;

  constructor(config: OpenAICompatibleProviderConfig) {
    this.config = config;

    this.axios = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      timeout: config.timeoutMs,
    });
  }

  /**
   * 哪些 HTTP 状态码值得重试：
   * - 429：限流
   * - 5xx：上游服务暂时异常
   * - 无 status：网络错误/无响应
   */
  private isRetryableStatus(status?: number): boolean {
    if (!status) return true; // 网络错误/无响应
    if (status === 429) return true;
    if (status >= 500 && status <= 599) return true;
    return false;
  }

  /**
   * 可被 AbortSignal 中断的 sleep。
   * 说明：用于重试的退避等待，避免在客户端断开后仍继续阻塞。
   */
  private async sleep(ms: number, signal?: AbortSignal): Promise<void> {
    if (ms <= 0) return;

    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => resolve(), ms);
      if (!signal) return;
      if (signal.aborted) {
        clearTimeout(t);
        reject(new Error('aborted'));
        return;
      }
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(t);
          reject(new Error('aborted'));
        },
        { once: true },
      );
    });
  }

  private async postWithRetry<T>(
    url: string,
    body: unknown,
    options: {
      responseType?: 'json' | 'stream';
      signal?: AbortSignal;
    },
  ): Promise<T> {
    // 说明：这里的重试只覆盖“建立请求阶段”。
    // 对于流式响应，一旦成功建立连接并开始接收数据，重试就不再介入（避免重复输出）。
    const maxRetries = 2;
    let attempt = 0;

    while (true) {
      try {
        const resp = await this.axios.post<T>(url, body, {
          responseType: options.responseType,
          signal: options.signal,
        });
        return resp.data;
      } catch (err) {
        const isAxios = axios.isAxiosError(err);
        const axiosErr = err as AxiosError<OpenAICompatibleApiError>;
        const status = isAxios ? axiosErr.response?.status : undefined;

        const aborted =
          (options.signal && options.signal.aborted) ||
          (isAxios && axiosErr.code === 'ERR_CANCELED');
        if (aborted) throw err;

        if (attempt >= maxRetries || !this.isRetryableStatus(status)) {
          throw err;
        }

        // 简单指数退避 + 抖动
        const backoff =
          300 * Math.pow(2, attempt) + Math.floor(Math.random() * 120);
        attempt += 1;
        await this.sleep(backoff, options.signal);
      }
    }
  }

  async createChatCompletion(params: {
    model: string;
    messages: ChatMessage[];
    temperature: number;
    maxTokens: number;
    signal?: AbortSignal;
  }): Promise<ChatCompletionResponse> {
    // 参数字段映射：OpenAI-compatible 使用 max_tokens
    return await this.postWithRetry<ChatCompletionResponse>(
      this.config.chatCompletionsPath,
      {
        model: params.model,
        stream: false,
        messages: params.messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      },
      { responseType: 'json', signal: params.signal },
    );
  }

  async createChatCompletionStream(params: {
    model: string;
    messages: ChatMessage[];
    temperature: number;
    maxTokens: number;
    signal?: AbortSignal;
  }): Promise<Readable> {
    // stream=true 时，上游返回 SSE（data: ...\n\n）格式。
    return await this.postWithRetry<Readable>(
      this.config.chatCompletionsPath,
      {
        model: params.model,
        stream: true,
        messages: params.messages,
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      },
      { responseType: 'stream', signal: params.signal },
    );
  }
}
