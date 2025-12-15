import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AnswerDocument = HydratedDocument<Answer>;

@Schema()
export class Answer {
  @Prop({ required: true })
  questionId: string; // 对应问卷的ID

  @Prop()
  answerList: {
    componentFeId: string; // 对应问卷里组件的ID
    value: string[];
  }[];
}

export const AnswerSchema = SchemaFactory.createForClass(Answer);
