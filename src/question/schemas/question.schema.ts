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

  @Prop()
  js: string; // 相关的JavaScript代码片段

  @Prop()
  css: string; // 相关的CSS代码片段

  @Prop({ default: false })
  isPublished: boolean; // 是否发布

  @Prop({ default: false })
  isStar: boolean; // 是否加星标

  @Prop({ default: false })
  isDeleted: boolean; // 是否删除

  @Prop()
  componentList: {
    fe_id: string; // 前端组件唯一标识 需要前端控制 由前端生成
    type: string; // 组件类型
    title: string; // 组件标题
    isHidden: boolean; // 组件是否隐藏
    isLocked: boolean; // 组件是否锁定
    props: object; // 组件属性
  }[];
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
