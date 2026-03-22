/**
 * 问卷服务
 * 处理问卷相关的所有API调用和数据解析
 */
import axios from './ajax';
import type { ResDataType } from './ajax';
import type { ComponentInfoType } from '../store/componentsReducer';
import type { AuditStatus } from '../types/audit';

/**
 * 问卷列表项类型
 */
export type QuestionListItem = {
  _id: string;             // 问卷ID
  title: string;           // 问卷标题
  isPublished: boolean;    // 是否发布
  isStar: boolean;         // 是否收藏
  isDeleted: boolean;      // 是否删除
  auditStatus?: AuditStatus; // 审核状态
  auditReason?: string;    // 审核原因
  answerCount: number;     // 回答数量
  createdAt: string;       // 创建时间
};

/**
 * 问卷列表响应类型
 */
export type QuestionListRes = {
  list: QuestionListItem[]; // 问卷列表
  count: number;            // 总数
};

/**
 * 问卷详情类型
 */
export type QuestionDetail = {
  _id: string;             // 问卷ID
  title: string;           // 问卷标题
  desc: string;            // 问卷描述
  js: string;              // 自定义JS
  css: string;             // 自定义CSS
  isPublished: boolean;    // 是否发布
  auditStatus?: AuditStatus; // 审核状态
  auditReason?: string;    // 审核原因
  componentList: ComponentInfoType[]; // 组件列表
};

/**
 * 类型守卫：判断是否为审核状态
 * @param value 要判断的值
 * @returns boolean 是否为审核状态
 */
function isAuditStatus(value: unknown): value is AuditStatus {
  return (
    value === 'Draft' ||
    value === 'PendingReview' ||
    value === 'Approved' ||
    value === 'Rejected'
  );
}

/**
 * 类型守卫：判断是否为对象
 * @param value 要判断的值
 * @returns boolean 是否为对象
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * 从对象中获取第一个数字值
 * @param record 对象
 * @param keys 键名数组
 * @returns number | undefined 数字值或undefined
 */
function getFirstNumber(
  record: Record<string, unknown>,
  keys: string[]
): number | undefined {
  for (const key of keys) {
    const v = record[key];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim().length > 0) {
      const parsed = Number(v);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

/**
 * 解析问卷列表响应数据
 * @param value 原始响应数据
 * @returns QuestionListRes 解析后的问卷列表数据
 */
function parseQuestionListRes(value: unknown): QuestionListRes {
  if (!isRecord(value)) return { list: [], count: 0 };

  const listRaw = value.list;
  const countRaw = value.count;

  const count = typeof countRaw === 'number' ? countRaw : Number(countRaw) || 0;
  const list: QuestionListItem[] = [];

  if (Array.isArray(listRaw)) {
    listRaw.forEach((item) => {
      if (!isRecord(item)) return;
      const id = item._id;
      const title = item.title;
      if (typeof id !== 'string') return;
      if (typeof title !== 'string') return;

      list.push({
        _id: id,
        title,
        isPublished: Boolean(item.isPublished),
        isStar: Boolean(item.isStar),
        isDeleted: Boolean(item.isDeleted),
        auditStatus: isAuditStatus(item.auditStatus)
          ? item.auditStatus
          : undefined,
        auditReason:
          typeof item.auditReason === 'string' ? item.auditReason : undefined,
        answerCount: (() => {
          // 兼容多种答案计数字段名
          const answerCountRaw =
            item.answerCount ??
            item.answer_count ??
            item.answersCount ??
            item.answerTotal ??
            item.responseCount ??
            item.responsesCount ??
            item.submitCount ??
            item.submissionCount ??
            getFirstNumber(item, [
              'answerCount',
              'responseCount',
              'submitCount',
            ]);
          return typeof answerCountRaw === 'number'
            ? answerCountRaw
            : Number(answerCountRaw) || 0;
        })(),
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
      });
    });
  }

  return { list, count };
}

/**
 * 解析组件信息
 * @param value 原始组件数据
 * @returns ComponentInfoType | null 解析后的组件信息或null
 */
function parseComponentInfo(value: unknown): ComponentInfoType | null {
  if (!isRecord(value)) return null;
  // 兼容多种ID字段名
  const fe_id = value.fe_id ?? value.feId ?? value.id ?? value._id;
  const type = value.type;
  const title = value.title;
  const propsRaw = value.props;

  if (typeof fe_id !== 'string') return null;
  if (typeof type !== 'string') return null;
  if (typeof title !== 'string') return null;

  let props: Record<string, unknown> = {};
  if (isRecord(propsRaw)) {
    props = propsRaw;
  } else if (propsRaw == null) {
    props = {};
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

  // 处理可选字段
  if (typeof value.isHidden === 'boolean') {
    component.isHidden = value.isHidden;
  }
  if (typeof value.isLocked === 'boolean') {
    component.isLocked = value.isLocked;
  }

  return component;
}

/**
 * 解析问卷详情响应数据
 * @param value 原始响应数据
 * @returns QuestionDetail 解析后的问卷详情
 * @throws Error 当数据格式错误时
 */
export function parseQuestionDetailRes(value: unknown): QuestionDetail {
  if (!isRecord(value)) {
    throw new Error('问卷详情格式错误');
  }

  // 兼容不同的数据结构
  const root = isRecord(value.question)
    ? value.question
    : isRecord(value.data)
      ? value.data
      : value;

  if (!isRecord(root)) {
    throw new Error('问卷详情格式错误');
  }

  const id = root._id ?? root.id;
  if (typeof id !== 'string') throw new Error('问卷 id 缺失');

  const title = typeof root.title === 'string' ? root.title : '';
  const desc = typeof root.desc === 'string' ? root.desc : '';
  const js = typeof root.js === 'string' ? root.js : '';
  const css = typeof root.css === 'string' ? root.css : '';
  const isPublished = Boolean(root.isPublished);
  const auditStatus = isAuditStatus(root.auditStatus)
    ? root.auditStatus
    : undefined;
  const auditReason =
    typeof root.auditReason === 'string' ? root.auditReason : undefined;

  // 解析组件列表
  const componentListRaw = root.componentList ?? root.components;
  const componentList: ComponentInfoType[] = [];
  if (Array.isArray(componentListRaw)) {
    componentListRaw.forEach((c) => {
      const parsed = parseComponentInfo(c);
      if (parsed) componentList.push(parsed);
    });
  }

  return {
    _id: id,
    title,
    desc,
    js,
    css,
    isPublished,
    auditStatus,
    auditReason,
    componentList,
  };
}

/**
 * 搜索选项类型
 */
type SearchOption = {
  keyword: string; // 搜索关键词
  isStar: boolean; // 是否收藏
  isDeleted: boolean; // 是否删除
  pageNum: number; // 页码
  pageSize: number; // 每页数量
  //...
};

/**
 * 获取单条问卷信息
 * @param id 问卷ID
 * @returns Promise<QuestionDetail> 问卷详情
 */
export async function getQuestionService(id: string): Promise<QuestionDetail> {
  const url = `/api/question/${id}`;
  const data = (await axios.get(url)) as unknown;
  return parseQuestionDetailRes(data);
}

/**
 * 新增问卷
 * @returns Promise<ResDataType> 新增结果
 */
export async function createQuestionService(): Promise<ResDataType> {
  const url = `/api/question`;
  const data = (await axios.post(url)) as ResDataType;
  return data;
}

/**
 * 获取（查询）问卷列表
 * @param options 搜索选项
 * @returns Promise<QuestionListRes> 问卷列表
 */
export async function getQuestionListService(
  options: Partial<SearchOption> = {}
): Promise<QuestionListRes> {
  console.log('options: ', options);

  const url = '/api/question';
  const data = (await axios.get(url, { params: options })) as unknown;
  return parseQuestionListRes(data);
}

/**
 * 修改/删除单个问卷
 * @param id 问卷ID
 * @param options 修改选项
 * @returns Promise<ResDataType> 修改结果
 */
export async function updateQuestionService(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: { [key: string]: any }
): Promise<ResDataType> {
  const url = `/api/question/${id}`;
  const data = (await axios.patch(url, options)) as ResDataType;
  return data;
}

/**
 * 提交审核（owner）
 * @param id 问卷ID
 * @returns Promise<ResDataType> 提交结果
 */
export async function submitQuestionReviewService(
  id: string
): Promise<ResDataType> {
  const url = `/api/question/${id}/submit-review`;
  const data = (await axios.post(url)) as ResDataType;
  return data;
}

/**
 * 复制问卷
 * @param id 问卷ID
 * @returns Promise<ResDataType> 复制结果
 */
export async function duplicateQuestionService(
  id: string
): Promise<ResDataType> {
  const url = `/api/question/duplicate/${id}`;
  const data = (await axios.post(url)) as ResDataType;
  return data;
}

/**
 * 导出问卷（后端导出，返回 JSON 数据）
 * @param id 问卷ID
 * @returns Promise<ResDataType> 导出结果
 */
export async function exportQuestionService(id: string): Promise<ResDataType> {
  const url = `/api/question/${id}/export`;
  const data = (await axios.get(url)) as ResDataType;
  return data;
}

/**
 * 导入问卷（后端导入，创建一份新问卷）
 * @param payload 导入数据
 * @returns Promise<ResDataType> 导入结果
 */
export async function importQuestionService(
  payload: unknown
): Promise<ResDataType> {
  const url = `/api/question/import`;
  const data = (await axios.post(url, payload)) as ResDataType;
  return data;
}

/**
 * 覆盖导入到当前问卷
 * @param id 问卷ID
 * @param payload 导入数据
 * @returns Promise<ResDataType> 导入结果
 */
export async function importIntoQuestionService(
  id: string,
  payload: unknown
): Promise<ResDataType> {
  const url = `/api/question/${id}/import`;
  const data = (await axios.post(url, payload)) as ResDataType;
  return data;
}

/**
 * 批量删除问卷
 * @param ids 问卷ID数组
 * @returns Promise<ResDataType> 删除结果
 */
export async function deleteQuestionService(
  ids: string[]
): Promise<ResDataType> {
  const url = `/api/question`;
  const data = (await axios.delete(url, { data: { ids } })) as ResDataType;
  return data;
}

/**
 * AI生成问卷
 * @param prompt 生成提示词
 * @returns Promise<ResDataType> 生成结果
 */
export async function aiGenerateQuestionService(
  prompt: string
): Promise<ResDataType> {
  const url = `/api/question/ai-generate`;
  // AI生成问卷是耗时操作，增加超时时间到60秒
  const data = (await axios.post(
    url,
    { prompt },
    { timeout: 60 * 1000 }
  )) as ResDataType;
  return data;
}
