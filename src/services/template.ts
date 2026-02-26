/**
 * @file 模板管理 Service 层
 * @description 对应文档 §3.3（B 端管理员接口）和 §4.1.2（Service 层建议），
 *   集中管理所有模板相关的 HTTP 请求函数。
 *
 * 设计原则：
 * 1. 使用统一的 axios 实例（src/services/ajax.ts），自动携带 token、统一错误拦截。
 * 2. 返回值做防御式解析（类型守卫），避免后端返回格式变化导致运行时崩溃。
 * 3. 函数命名遵循项目约定：`xxxService` 表示对服务端的调用。
 */

import axios from './ajax';
import type { ResDataType } from './ajax';
import type {
  AdminTemplateListItem,
  AdminTemplateListRes,
  CreateTemplateBody,
  GetAdminTemplateListParams,
  TemplateDetail,
  TemplateStatus,
  UpdateTemplateBody,
} from '../types/template';
import type { ComponentInfoType } from '../store/componentsReducer';

// ─── 类型守卫（工具函数） ──────────────────────────────────

/** 判断一个值是否是普通对象 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** 判断字符串是否是合法的 TemplateStatus */
function isTemplateStatus(value: unknown): value is TemplateStatus {
  return value === 'draft' || value === 'published';
}

// ─── 解析函数（防御式处理后端返回） ─────────────────────────

/**
 * 解析单个组件信息
 *
 * 兼容后端返回的各种 id 字段名：fe_id / feId / id / _id
 * props 兼容对象、null、JSON 字符串三种形式
 */
function parseComponentInfo(value: unknown): ComponentInfoType | null {
  if (!isRecord(value)) return null;

  // 兼容多种 id 命名方式
  const fe_id = value.fe_id ?? value.feId ?? value.id ?? value._id;
  const type = value.type;
  const title = value.title;
  const propsRaw = value.props;

  // fe_id / type / title 是必须字段
  if (typeof fe_id !== 'string') return null;
  if (typeof type !== 'string') return null;
  if (typeof title !== 'string') return null;

  // 解析 props：兼容对象、null、JSON 字符串
  let props: Record<string, unknown> = {};
  if (isRecord(propsRaw)) {
    props = propsRaw;
  } else if (typeof propsRaw === 'string') {
    try {
      const parsed = JSON.parse(propsRaw) as unknown;
      props = isRecord(parsed) ? parsed : {};
    } catch {
      props = {};
    }
  }

  const component: ComponentInfoType = {
    fe_id,
    type,
    title,
    props: props as ComponentInfoType['props'],
  };

  // 可选布尔字段
  if (typeof value.isHidden === 'boolean') component.isHidden = value.isHidden;
  if (typeof value.isLocked === 'boolean') component.isLocked = value.isLocked;

  return component;
}

/**
 * 解析管理员模板列表的单条记录
 *
 * 将后端返回的松散数据结构规范化为 AdminTemplateListItem
 */
function parseAdminTemplateListItem(
  value: unknown
): AdminTemplateListItem | null {
  if (!isRecord(value)) return null;

  // id 兼容 _id / id
  const id = value._id ?? value.id;
  if (typeof id !== 'string' && typeof id !== 'number') return null;

  const title = value.title;
  if (typeof title !== 'string') return null;

  // 解析 templateStatus，默认 'draft'
  const templateStatus = isTemplateStatus(value.templateStatus)
    ? value.templateStatus
    : 'draft';

  // isPublished 可由 templateStatus 推导，也可能后端直接返回
  const isPublished =
    typeof value.isPublished === 'boolean'
      ? value.isPublished
      : templateStatus === 'published';

  // 组件摘要：后端可能返回 componentSummary 数组
  let componentSummary: Array<{ type: string; count: number }> | undefined;
  if (Array.isArray(value.componentSummary)) {
    componentSummary = value.componentSummary.filter(
      (s): s is { type: string; count: number } =>
        isRecord(s) && typeof s.type === 'string' && typeof s.count === 'number'
    );
  }

  return {
    id: String(id),
    title,
    templateDesc:
      typeof value.templateDesc === 'string' ? value.templateDesc : undefined,
    desc: typeof value.desc === 'string' ? value.desc : undefined,
    cover: typeof value.cover === 'string' ? value.cover : undefined,
    componentSummary,
    templateStatus,
    isPublished,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : '',
  };
}

/**
 * 解析管理员模板列表接口返回值
 *
 * 将后端返回的松散 JSON 规范化为 AdminTemplateListRes
 */
function parseAdminTemplateListRes(value: unknown): AdminTemplateListRes {
  if (!isRecord(value)) return { list: [], count: 0, page: 1, pageSize: 10 };

  const listRaw = value.list;
  const list: AdminTemplateListItem[] = [];

  if (Array.isArray(listRaw)) {
    listRaw.forEach((item) => {
      const parsed = parseAdminTemplateListItem(item);
      if (parsed) list.push(parsed);
    });
  }

  return {
    list,
    count: typeof value.count === 'number' ? value.count : list.length,
    page: typeof value.page === 'number' ? value.page : 1,
    pageSize: typeof value.pageSize === 'number' ? value.pageSize : 10,
  };
}

/**
 * 解析模板详情
 *
 * 兼容后端返回 { template: {...} } 或直接返回 {...} 两种包裹方式
 */
function parseTemplateDetailRes(value: unknown): TemplateDetail {
  if (!isRecord(value)) throw new Error('模板详情格式错误');

  // 兼容 { template: {...} } 和 { data: {...} } 两种包裹
  const root = isRecord(value.template)
    ? value.template
    : isRecord(value.data)
      ? value.data
      : value;

  if (!isRecord(root)) throw new Error('模板详情格式错误');

  const id = root._id ?? root.id;
  if (typeof id !== 'string') throw new Error('模板 id 缺失');

  // 解析 componentList
  const componentListRaw = root.componentList ?? root.components;
  const componentList: ComponentInfoType[] = [];
  if (Array.isArray(componentListRaw)) {
    componentListRaw.forEach((c) => {
      const parsed = parseComponentInfo(c);
      if (parsed) componentList.push(parsed);
    });
  }

  return {
    id,
    title: typeof root.title === 'string' ? root.title : '',
    templateDesc:
      typeof root.templateDesc === 'string' ? root.templateDesc : undefined,
    desc: typeof root.desc === 'string' ? root.desc : '',
    js: typeof root.js === 'string' ? root.js : '',
    css: typeof root.css === 'string' ? root.css : '',
    templateStatus: isTemplateStatus(root.templateStatus)
      ? root.templateStatus
      : 'draft',
    componentList,
  };
}

// ═══════════════════════════════════════════════════════════
//  管理员模板管理接口（§3.3）
// ═══════════════════════════════════════════════════════════

/**
 * 获取管理员模板列表
 *
 * 对应接口：GET /api/admin/templates
 * 权限要求：admin
 * 返回：包含 draft + published 的所有模板，支持分页、关键词搜索、状态过滤
 */
export async function getAdminTemplateListService(
  params: GetAdminTemplateListParams
): Promise<AdminTemplateListRes> {
  const data = (await axios.get('/api/admin/templates', {
    params,
  })) as unknown;
  return parseAdminTemplateListRes(data);
}

/**
 * 获取管理员模板详情（编辑/预览用）
 *
 * 对应接口：GET /api/admin/templates/:id
 * 权限要求：admin
 * 不受 templateStatus 限制，draft 状态的模板也能查看
 */
export async function getAdminTemplateDetailService(
  id: string
): Promise<TemplateDetail> {
  const data = (await axios.get(`/api/admin/templates/${id}`)) as unknown;
  return parseTemplateDetailRes(data);
}

/**
 * 创建模板（从空模板创建）
 *
 * 对应接口：POST /api/admin/templates
 * 权限要求：admin
 * 返回：新创建的模板 id
 */
export async function createAdminTemplateService(
  body: CreateTemplateBody
): Promise<ResDataType> {
  const data = (await axios.post('/api/admin/templates', body)) as ResDataType;
  return data;
}

/**
 * 从现有问卷创建模板
 *
 * 对应接口：POST /api/admin/templates/from-question/:questionId
 * 权限要求：admin
 * 行为：将指定问卷的结构（title/desc/componentList）复制为一个新模板（draft 状态）
 * 返回：新创建的模板 id
 */
export async function createTemplateFromQuestionService(
  questionId: string
): Promise<ResDataType> {
  const data = (await axios.post(
    `/api/admin/templates/from-question/${questionId}`
  )) as ResDataType;
  return data;
}

/**
 * 更新模板信息
 *
 * 对应接口：PATCH /api/admin/templates/:id
 * 权限要求：admin
 * 可更新字段：title / desc / templateDesc / js / css / componentList
 */
export async function updateAdminTemplateService(
  id: string,
  body: UpdateTemplateBody
): Promise<ResDataType> {
  const data = (await axios.patch(
    `/api/admin/templates/${id}`,
    body
  )) as ResDataType;
  return data;
}

/**
 * 发布模板（draft → published）
 *
 * 对应接口：POST /api/admin/templates/:id/publish
 * 权限要求：admin
 * 行为：将模板 templateStatus 设为 'published'，C 端可见
 */
export async function publishAdminTemplateService(
  id: string
): Promise<ResDataType> {
  const data = (await axios.post(
    `/api/admin/templates/${id}/publish`
  )) as ResDataType;
  return data;
}

/**
 * 下线模板（published → draft）
 *
 * 对应接口：POST /api/admin/templates/:id/unpublish
 * 权限要求：admin
 * 行为：将模板 templateStatus 设为 'draft'，C 端不再可见
 */
export async function unpublishAdminTemplateService(
  id: string
): Promise<ResDataType> {
  const data = (await axios.post(
    `/api/admin/templates/${id}/unpublish`
  )) as ResDataType;
  return data;
}

/**
 * 删除模板
 *
 * 对应接口：DELETE /api/admin/templates/:id
 * 权限要求：admin
 * 行为：永久删除模板（或软删除，取决于后端实现）
 */
export async function deleteAdminTemplateService(
  id: string
): Promise<ResDataType> {
  const data = (await axios.delete(
    `/api/admin/templates/${id}`
  )) as ResDataType;
  return data;
}
