import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { StatReportController } from './stat-report.controller';
import { StatReportService } from './stat-report.service';
import { AIReport, AIReportSchema } from './schemas/ai-report.schema';
import { Question, QuestionSchema } from '../question/schemas/question.schema';
import { Answer, AnswerSchema } from '../answer/schemas/answer.schema';
import { QuestionReview, QuestionReviewSchema } from '../review/schemas/question-review.schema';
import { AIService } from '../ai/ai.service';
import { StatService } from '../stat/stat.service';
import { AIConfigService } from '../config/ai.config';
import { AnswerService } from '../answer/answer.service';
import { QuestionService } from '../question/question.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: AIReport.name, schema: AIReportSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: Answer.name, schema: AnswerSchema },
      { name: QuestionReview.name, schema: QuestionReviewSchema },
    ]),
  ],
  controllers: [StatReportController],
  providers: [
    StatReportService,
    AIService,
    StatService,
    AIConfigService,
    AnswerService,
    QuestionService,
  ],
  exports: [StatReportService],
})
export class StatReportModule {}
