/**
 * AI 配置文件
 * 用于管理 AI 服务（OpenAI-compatible：OpenAI/DeepSeek/其他兼容接口）的配置信息
 *
 * 使用 NestJS ConfigModule 进行配置管理
 *
 * 使用方式：
 * 1. 在项目根目录创建 .env 文件
 * 2. 参考 .env.example 文件添加配置
 * 3. 配置会自动通过 ConfigModule 加载
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AIConfig {
  /**
   * AI 供应商标识。
   *
   * - tongyi：阿里通义（DashScope）的 OpenAI-compatible 模式
   * - openai-compatible：任意 OpenAI-compatible 的 Chat Completions 服务
   */
  provider: 'tongyi' | 'openai-compatible';
  apiKey: string;
  baseUrl: string;
  chatCompletionsPath: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
}

function getDefaultApiUrl(provider: AIConfig['provider']): string {
  // 注意：这里给出“默认值”，不代表唯一正确配置；用户可通过 AI_API_URL 覆盖。
  if (provider === 'tongyi') {
    // DashScope 的 OpenAI-compatible 通常是带前缀的 v1：/compatible-mode/v1/chat/completions
    return 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
  }

  // openai-compatible：不同厂商 URL / 路径差异较大，建议显式配置 AI_API_URL。
  return '';
}

function getDefaultModel(provider: AIConfig['provider']): string {
  // 说明：默认模型只是“开箱可用”的兜底值，建议在 .env 显式配置 AI_MODEL。
  if (provider === 'tongyi') return 'qwen-plus';
  return '';
}

function parseApiUrl(input: string): { baseUrl: string; path: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('AI_API_URL 不能为空');
  }

  // 允许两种写法：
  // 1) 完整地址：https://host/prefix/v1/chat/completions
  // 2) baseURL：https://host 或 https://host/prefix/v1
  //
  // 说明：为了支持“baseURL 本身带路径前缀”（如通义兼容模式 /compatible-mode/v1），
  // 这里会尽量保留 pathname 在 baseUrl 中。
  try {
    const url = new URL(trimmed);

    // full endpoint：包含 /chat/completions
    const completionsIndex = url.pathname.indexOf('/chat/completions');
    if (completionsIndex >= 0) {
      const prefix = url.pathname.slice(0, completionsIndex);
      const baseUrl = `${url.origin}${prefix}`;
      const path = url.pathname.slice(completionsIndex);
      return { baseUrl, path };
    }

    // baseURL：可能是 https://host 或 https://host/prefix/v1
    const baseUrl = `${url.origin}${url.pathname.replace(/\/+$/, '')}`;
    const endsWithV1 = url.pathname.replace(/\/+$/, '').endsWith('/v1');
    const path = endsWithV1 ? '/chat/completions' : '/v1/chat/completions';

    return {
      baseUrl: baseUrl === url.origin ? url.origin : baseUrl,
      path,
    };
  } catch {
    throw new Error(`AI_API_URL 不是合法 URL：${input}`);
  }
}

@Injectable()
export class AIConfigService {
  constructor(private readonly configService: ConfigService) {}

  getConfig(): AIConfig {
    // provider：当前后端实现基于 OpenAI-compatible Chat Completions。
    // 为了“通义优先”，这里默认 provider 取 tongyi（如需其他供应商请在 .env 指定 AI_PROVIDER）。
    const providerRaw = this.configService.get<string>('AI_PROVIDER')?.trim();

    const provider: AIConfig['provider'] =
      providerRaw === 'openai-compatible' ? 'openai-compatible' : 'tongyi';

    const apiKey = this.configService.get<string>('AI_API_KEY');

    const apiUrlRaw = this.configService.get<string>('AI_API_URL')?.trim();
    const apiUrl = apiUrlRaw || getDefaultApiUrl(provider);

    if (!apiUrl) {
      throw new Error(
        '当 AI_PROVIDER=openai-compatible 时，必须显式配置 AI_API_URL（例如 https://api.openai.com/v1/chat/completions）',
      );
    }

    const { baseUrl, path } = parseApiUrl(apiUrl);

    const chatCompletionsPath =
      this.configService.get<string>('AI_CHAT_COMPLETIONS_PATH') || path;

    const modelRaw = this.configService.get<string>('AI_MODEL')?.trim();
    const model = modelRaw || getDefaultModel(provider);

    if (!model) {
      throw new Error(
        '当 AI_PROVIDER=openai-compatible 时，必须显式配置 AI_MODEL（例如 gpt-4o-mini / deepseek-chat 等）',
      );
    }

    // 当前获取的temperature是字符串，需转换为数字
    const temperatureStr = this.configService.get<string>('AI_TEMPERATURE');
    const temperature = temperatureStr ? parseFloat(temperatureStr) : 0.7;
    // token同理，需要转换为数字
    const maxTokensStr = this.configService.get<string>('AI_MAX_TOKENS');
    const maxTokens = maxTokensStr ? parseInt(maxTokensStr, 10) : 2000;

    const timeoutStr = this.configService.get<string>('AI_TIMEOUT_MS');
    const timeoutMs = timeoutStr ? parseInt(timeoutStr, 10) : 120000;

    if (!apiKey) {
      throw new Error('AI_API_KEY 环境变量未设置，请在 .env 文件中配置');
    }

    return {
      provider,
      apiKey,
      baseUrl,
      chatCompletionsPath,
      model,
      temperature,
      maxTokens,
      timeoutMs,
    };
  }
}
