import axios from './ajax';
import type { ResDataType } from './ajax';
import type { ComponentInfoType } from '../store/componentsReducer';
import type { AuditStatus } from '../types/audit';

export type QuestionListItem = {
  _id: string;
  title: string;
  isPublished: boolean;
  isStar: boolean;
  isDeleted: boolean;
  auditStatus?: AuditStatus;
  auditReason?: string;
  answerCount: number;
  createdAt: string;
};

export type QuestionListRes = {
  list: QuestionListItem[];
  count: number;
};

export type QuestionDetail = {
  _id: string;
  title: string;
  desc: string;
  js: string;
  css: string;
  isPublished: boolean;
  auditStatus?: AuditStatus;
  auditReason?: string;
  componentList: ComponentInfoType[];
};

function isAuditStatus(value: unknown): value is AuditStatus {
  return (
    value === 'Draft' ||
    value === 'PendingReview' ||
    value === 'Approved' ||
    value === 'Rejected'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

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
        answerCount:
          typeof item.answerCount === 'number'
            ? item.answerCount
            : Number(item.answerCount) || 0,
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
      });
    });
  }

  return { list, count };
}

function parseComponentInfo(value: unknown): ComponentInfoType | null {
  if (!isRecord(value)) return null;
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

  if (typeof value.isHidden === 'boolean') {
    component.isHidden = value.isHidden;
  }
  if (typeof value.isLocked === 'boolean') {
    component.isLocked = value.isLocked;
  }

  return component;
}

export function parseQuestionDetailRes(value: unknown): QuestionDetail {
  if (!isRecord(value)) {
    throw new Error('问卷详情格式错误');
  }

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

type SearchOption = {
  keyword: string; // 搜索关键词
  isStar: boolean; // 是否收藏
  isDeleted: boolean; // 是否删除
  pageNum: number; // 页码
  pageSize: number; // 每页数量
  //...
};

// 获取单条问卷信息
export async function getQuestionService(id: string): Promise<QuestionDetail> {
  const url = `/api/question/${id}`;
  const data = (await axios.get(url)) as unknown;
  return parseQuestionDetailRes(data);
}

// 新增问卷
export async function createQuestionService(): Promise<ResDataType> {
  const url = `/api/question`;
  const data = (await axios.post(url)) as ResDataType;
  return data;
}

// 获取（查询）问卷列表
export async function getQuestionListService(
  options: Partial<SearchOption> = {}
): Promise<QuestionListRes> {
  console.log('options: ', options);

  const url = '/api/question';
  const data = (await axios.get(url, { params: options })) as unknown;
  return parseQuestionListRes(data);
}

// 修改/删除单个问卷
export async function updateQuestionService(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options: { [key: string]: any }
): Promise<ResDataType> {
  const url = `/api/question/${id}`;
  const data = (await axios.patch(url, options)) as ResDataType;
  return data;
}

// 提交审核（owner）
export async function submitQuestionReviewService(
  id: string
): Promise<ResDataType> {
  const url = `/api/question/${id}/submit-review`;
  const data = (await axios.post(url)) as ResDataType;
  return data;
}

// 复制问卷
export async function duplicateQuestionService(
  id: string
): Promise<ResDataType> {
  const url = `/api/question/duplicate/${id}`;
  const data = (await axios.post(url)) as ResDataType;
  return data;
}

// 导出问卷（后端导出，返回 JSON 数据）
export async function exportQuestionService(id: string): Promise<ResDataType> {
  const url = `/api/question/${id}/export`;
  const data = (await axios.get(url)) as ResDataType;
  return data;
}

// 导入问卷（后端导入，创建一份新问卷）
export async function importQuestionService(
  payload: unknown
): Promise<ResDataType> {
  const url = `/api/question/import`;
  const data = (await axios.post(url, payload)) as ResDataType;
  return data;
}

// 覆盖导入到当前问卷
export async function importIntoQuestionService(
  id: string,
  payload: unknown
): Promise<ResDataType> {
  const url = `/api/question/${id}/import`;
  const data = (await axios.post(url, payload)) as ResDataType;
  return data;
}

// 批量删除问卷
export async function deleteQuestionService(
  ids: string[]
): Promise<ResDataType> {
  const url = `/api/question`;
  const data = (await axios.delete(url, { data: { ids } })) as ResDataType;
  return data;
}

// AI生成问卷
export async function aiGenerateQuestionService(
  prompt: string
): Promise<ResDataType> {
  const url = `/api/question/ai-generate`;
  // AI生成问卷是耗时操作，增加超时时间到30秒
  const data = (await axios.post(
    url,
    { prompt },
    { timeout: 60 * 1000 }
  )) as ResDataType;
  return data;
}
