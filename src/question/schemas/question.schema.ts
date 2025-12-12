import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QuestionDocument = HydratedDocument<Question>;

@Schema({
  timestamps: true, // 自动添加 createdAt 和 updatedAt 字段 记录时间戳
})
export class Question {
  @Prop({ required: true })
  title: string; // 问题标题

  @Prop()
  desc: string; // 问题描述

  @Prop({ required: true })
  author: string; // 问题作者
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
