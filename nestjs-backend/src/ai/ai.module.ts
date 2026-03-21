import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import { AIConfigService } from '../config/ai.config';

/**
 * AI 模块
 *
 * - 通过 ConfigModule 读取环境变量（AI_*）
 * - 提供 AIService 给 QuestionService 调用
 */
@Module({
  imports: [ConfigModule],
  providers: [AIService, AIConfigService],
  exports: [AIService],
})
export class AIModule {}
