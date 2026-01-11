/**
 * AI 配置文件
 * 用于管理 DeepSeek 等 AI 服务的配置信息
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
  apiKey: string;
  apiUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

@Injectable()
export class AIConfigService {
  constructor(private readonly configService: ConfigService) {}

  // https://api.deepseek.com
  getConfig(): AIConfig {
    const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');
    const apiUrl =
      this.configService.get<string>('DEEPSEEK_API_URL') ||
      'https://api.deepseek.com/v1/chat/completions';
    const model =
      this.configService.get<string>('DEEPSEEK_MODEL') || 'deepseek-chat';
    // 当前获取的temperature是字符串，需转换为数字
    const temperatureStr = this.configService.get<string>(
      'DEEPSEEK_TEMPERATURE',
    );
    const temperature = temperatureStr ? parseFloat(temperatureStr) : 0.7;
    // token同理，需要转换为数字
    const maxTokensStr = this.configService.get<string>('DEEPSEEK_MAX_TOKENS');
    const maxTokens = maxTokensStr ? parseInt(maxTokensStr, 10) : 2000;

    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY 环境变量未设置，请在 .env 文件中配置');
    }

    return {
      apiKey,
      apiUrl,
      model,
      temperature,
      maxTokens,
    };
  }
}

/**
 * 兼容旧代码的导出函数（已废弃，建议使用 AIConfigService）
 * @deprecated 请使用 AIConfigService 替代
 */
export const getAIConfig = (): AIConfig => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const apiUrl =
    process.env.DEEPSEEK_API_URL ||
    'https://api.deepseek.com/v1/chat/completions';
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
  const temperature = process.env.DEEPSEEK_TEMPERATURE
    ? parseFloat(process.env.DEEPSEEK_TEMPERATURE)
    : 0.7;
  const maxTokens = process.env.DEEPSEEK_MAX_TOKENS
    ? parseInt(process.env.DEEPSEEK_MAX_TOKENS, 10)
    : 2000;

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY 环境变量未设置，请在 .env 文件中配置');
  }

  return {
    apiKey,
    apiUrl,
    model,
    temperature,
    maxTokens,
  };
};
