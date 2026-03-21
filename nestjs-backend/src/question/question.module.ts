import { Module } from '@nestjs/common';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Question, QuestionSchema } from './schemas/question.schema';
import { Answer, AnswerSchema } from '../answer/schemas/answer.schema';
import { AIModule } from '../ai/ai.module';
import { ReviewModule } from '../review/review.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { schema: QuestionSchema, name: Question.name },
      { schema: AnswerSchema, name: Answer.name },
    ]),
    AIModule,
    ReviewModule,
  ],
  exports: [QuestionService],
  controllers: [QuestionController],
  providers: [QuestionService],
})
export class QuestionModule {}
