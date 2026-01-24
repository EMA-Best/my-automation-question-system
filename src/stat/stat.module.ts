import { Module } from '@nestjs/common';
import { StatService } from './stat.service';
import { StatController } from './stat.controller';
import { QuestionModule } from 'src/question/question.module';
import { AnswerModule } from 'src/answer/answer.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Question, QuestionSchema } from 'src/question/schemas/question.schema';
import { Answer, AnswerSchema } from 'src/answer/schemas/answer.schema';

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
