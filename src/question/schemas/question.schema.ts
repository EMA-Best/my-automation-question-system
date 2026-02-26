import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QuestionDocument = HydratedDocument<Question>;

@Schema({
  timestamps: true, // 自动添加 createdAt 和 updatedAt 字段 记录时间戳
})
export class Question {
  @Prop({ required: true })
  title: string; // 问卷标题

  @Prop()
  desc: string; // 问卷描述

  @Prop({ required: true })
  author: string; // 问卷作者

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

  // -----------------------------
  // 删除/恢复审计（回收站）
  // -----------------------------
  @Prop({ type: Date, default: null, index: true })
  deletedAt?: Date | null;

  // 约定：存 username（与 author 一致）；通过 users 表 lookup 补全昵称
  @Prop({ type: String, default: '', index: true })
  deletedBy?: string;

  @Prop({ type: String, default: '' })
  deleteReason?: string;

  @Prop({ type: Date, default: null })
  restoredAt?: Date | null;

  @Prop({ type: String, default: '' })
  restoredBy?: string;

  // -----------------------------
  // 审核流（迭代B）
  // -----------------------------
  @Prop({
    type: String,
    enum: ['Draft', 'PendingReview', 'Approved', 'Rejected'],
    default: 'Draft',
    index: true,
  })
  auditStatus: 'Draft' | 'PendingReview' | 'Approved' | 'Rejected';

  @Prop({ default: '' })
  auditReason?: string;

  @Prop({ type: Date, default: null, index: true })
  auditUpdatedAt?: Date | null;

  // -----------------------------
  // 运营字段（迭代C 会用到，先占位）
  // -----------------------------
  @Prop({ default: false })
  featured?: boolean;

  @Prop({ default: false })
  pinned?: boolean;

  @Prop({ type: Date, default: null })
  pinnedAt?: Date | null;

  // -----------------------------
  // 模板相关字段
  // -----------------------------
  @Prop({ default: false, index: true })
  isTemplate?: boolean; // true=模板，false=普通问卷

  @Prop({
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
  })
  templateStatus?: 'draft' | 'published'; // 模板发布状态

  @Prop({ default: '' })
  templateDesc?: string; // C 端展示的模板描述

  @Prop({ default: '' })
  cover?: string; // 模板封面图 URL

  @Prop({ default: '' })
  category?: string; // 模板分类

  @Prop({ type: [String], default: [] })
  tags?: string[]; // 模板标签

  @Prop({ type: Number, default: 0 })
  sort?: number; // 排序权重（越大越靠前）

  @Prop()
  componentList: {
    fe_id: string; // 前端组件唯一标识 需要前端控制 由前端生成
    type: string; // 组件类型
    title: string; // 组件标题
    isHidden: boolean; // 组件是否隐藏
    isLocked: boolean; // 组件是否锁定
    props: Record<string, unknown>; // 组件属性
  }[];
}

export const QuestionSchema = SchemaFactory.createForClass(Question);

// 常用筛选条件的联合索引（列表查询/统计查询）
QuestionSchema.index({ author: 1, isDeleted: 1, isStar: 1, _id: -1 });

// 回收站常用索引
QuestionSchema.index({ isDeleted: 1, deletedAt: -1, _id: -1 });
QuestionSchema.index({ deletedBy: 1, deletedAt: -1 });

// 审核队列索引
QuestionSchema.index({ auditStatus: 1, auditUpdatedAt: -1 });

// 模板列表索引（公开查询 + 管理端查询）
QuestionSchema.index({ isTemplate: 1, templateStatus: 1, sort: -1, _id: -1 });
