/**
 * 这些类型用于描述“OpenAI-compatible Chat Completions”接口的最小字段集合。
 *
 * 说明：各家厂商可能返回更多字段，但本项目只依赖其中一小部分，
 * 因此这里保持“最小可用”以降低耦合。
 */
export type ChatMessageRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
}

export interface ChatCompletionChoice {
  message: ChatMessage;
  finish_reason?: string;
  index?: number;
}

export interface ChatCompletionResponse {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: ChatCompletionChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface ChatCompletionStreamChunk {
  /**
   * SSE 流式增量：choices[0].delta.content 为本次增量文本。
   * - OpenAI/DeepSeek/通义兼容模式通常都遵循该结构
   */
  choices?: Array<{
    delta?: {
      content?: string;
      role?: string;
    };
    finish_reason?: string | null;
    index?: number;
  }>;
}

export interface OpenAICompatibleApiError {
  /** OpenAI-compatible 常见错误结构：{ error: { message, type, code } } */
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}
