/**
 * @file 模板系统 - 前端类型定义
 * @description 对应文档 §2（数据模型）和 §10（接口类型对齐建议），
 *   所有模板相关的 TS 类型集中于此，供 service/hooks/页面层引用。
 *
 * 核心设计：模板本质是 "问卷结构的快照"，复用 ComponentInfoType，
 *   通过 isTemplate + templateStatus 字段区分。
 */

import type { ComponentInfoType } from '../store/componentsReducer';

// ─── 模板状态枚举 ──────────────────────────────────────────
/** 模板发布状态：draft = 仅管理员可见 | published = C 端可见 */
export type TemplateStatus = 'draft' | 'published';

// ─── C 端公开接口的类型（§3.1） ─────────────────────────────

/**
 * 模板列表项（C 端 / B 端列表均可复用）
 *
 * 对应接口：GET /api/templates 和 GET /api/admin/templates
 */
export type TemplateListItem = {
  /** 模板唯一标识（后端 _id 或 id） */
  id: string;
  /** 模板标题 */
  title: string;
  /** C 端卡片展示用描述 */
  templateDesc?: string;
  /** 封面图 URL（可选增强字段） */
  cover?: string;
  /** 组件类型摘要，用于卡片展示"包含 N 个单选、M 个输入框" */
  componentSummary?: Array<{ type: string; count: number }>;
  /** 创建时间（ISO 字符串） */
  createdAt: string;
};

/**
 * 管理后台模板列表项
 *
 * 继承公开字段，额外包含仅管理员可见的管理字段：
 * - templateStatus：草稿/已发布
 * - isPublished：是否已发布（冗余字段，方便 UI 展示）
 *
 * 对应接口：GET /api/admin/templates
 */
export type AdminTemplateListItem = TemplateListItem & {
  /** 模板发布状态 */
  templateStatus: TemplateStatus;
  /** 是否已发布（templateStatus === 'published'） */
  isPublished: boolean;
  /** 模板描述（表格里显示，不同于 templateDesc 可能更简短） */
  desc?: string;
};

// ─── 管理后台列表接口返回值（§3.3.1） ──────────────────────

/** GET /api/admin/templates 的返回结构 */
export type AdminTemplateListRes = {
  list: AdminTemplateListItem[];
  count: number;
  page: number;
  pageSize: number;
};

// ─── 查询参数（§3.3.1） ────────────────────────────────────

/** 管理员模板列表查询参数 */
export type GetAdminTemplateListParams = {
  page: number;
  pageSize: number;
  keyword?: string;
  templateStatus?: TemplateStatus;
};

// ─── 模板详情（§3.1.2 + §3.3.4） ──────────────────────────

/**
 * 模板详情（完整结构，用于编辑/预览）
 *
 * componentList 直接复用现有的 ComponentInfoType，
 * 保持和问卷编辑器数据结构一致，方便后续编辑器复用。
 */
export type TemplateDetail = {
  /** 模板唯一标识 */
  id: string;
  /** 模板标题 */
  title: string;
  /** C 端展示用的描述文案 */
  templateDesc?: string;
  /** 问卷描述（和问卷共用的 desc 字段） */
  desc: string;
  /** 自定义 JS */
  js: string;
  /** 自定义 CSS */
  css: string;
  /** 模板发布状态 */
  templateStatus: TemplateStatus;
  /** 组件列表（复用 ComponentInfoType，与编辑器完全对齐） */
  componentList: ComponentInfoType[];
};

// ─── 创建/更新模板的请求体（§3.3.2 + §3.3.3） ─────────────

/** 创建模板时的请求体 */
export type CreateTemplateBody = {
  /** 模板标题 */
  title: string;
  /** C 端展示用描述 */
  templateDesc?: string;
  /** 问卷描述 */
  desc?: string;
  /** 自定义 JS */
  js?: string;
  /** 自定义 CSS */
  css?: string;
  /** 初始组件列表（可为空，后续通过编辑器添加） */
  componentList?: ComponentInfoType[];
};

/** 更新模板时的请求体（所有字段均为可选） */
export type UpdateTemplateBody = Partial<CreateTemplateBody>;

// ─── "使用模板"接口返回值（§3.2.1） ────────────────────────

/** POST /api/templates/:id/use 的返回值 */
export type UseTemplateRes = {
  /** 克隆生成的新问卷 ID */
  questionId: string;
};
