import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AIService } from './ai.service';
import { AIConfigService } from '../config/ai.config';

@Module({
  imports: [ConfigModule],
  providers: [AIService, AIConfigService],
  exports: [AIService],
})
export class AIModule {}
