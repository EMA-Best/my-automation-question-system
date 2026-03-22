import { Module } from '@nestjs/common';
import { StatService } from './stat.service';
import { StatController } from './stat.controller';
import { QuestionModule } from '../question/question.module';
import { AnswerModule } from '../answer/answer.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Question, QuestionSchema } from '../question/schemas/question.schema';
import { Answer, AnswerSchema } from '../answer/schemas/answer.schema';

@Module({
  imports: [
    QuestionModule,
    AnswerModule,
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: Answer.name, schema: AnswerSchema },
    ]),
  ],
  providers: [StatService],
  controllers: [StatController],
})
export class StatModule {}
