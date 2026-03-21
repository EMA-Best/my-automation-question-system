import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AnswerDocument = HydratedDocument<Answer>;

@Schema({
  timestamps: true,
})
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

// 问卷答卷分页/统计：find/count/deleteMany 都依赖 questionId，分页还按 createdAt 倒序。
AnswerSchema.index({ questionId: 1, createdAt: -1, _id: -1 });
