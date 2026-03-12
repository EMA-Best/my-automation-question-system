import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TemplateDocument = HydratedDocument<Template>;

/**
 * 模板实体（独立集合）
 *
 * 设计目标：
 * - 与 Question 解耦，避免同表承载“问卷实例 + 模板资产”双语义。
 * - 保留与前端模板管理一致的字段，后续可独立扩展模板能力。
 */
@Schema({
  timestamps: true,
  collection: 'templates',
})
export class Template {
  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  templateDesc?: string;

  @Prop({ default: '' })
  js?: string;

  @Prop({ default: '' })
  css?: string;

  @Prop({ type: Number, default: 0 })
  sort?: number;

  @Prop({
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
    index: true,
  })
  templateStatus?: 'draft' | 'published';

  @Prop({ required: true, index: true })
  author: string;

  // 记录模板来源问卷（可选），用于追溯来源。
  @Prop({ type: String, default: '', index: true })
  sourceQuestionId?: string;

  @Prop({ type: Number, default: 0 })
  useCount?: number;

  @Prop({
    type: [
      {
        fe_id: { type: String, required: true },
        type: { type: String, required: true },
        title: { type: String, required: true },
        isHidden: { type: Boolean, default: false },
        isLocked: { type: Boolean, default: false },
        props: { type: Object, default: {} },
      },
    ],
    default: [],
  })
  componentList: Array<{
    fe_id: string;
    type: string;
    title: string;
    isHidden?: boolean;
    isLocked?: boolean;
    props?: Record<string, unknown>;
  }>;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);

// 管理端模板列表常用索引
TemplateSchema.index({ templateStatus: 1, sort: -1, _id: -1 });
