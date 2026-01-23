import axios, { ResDataType } from './ajax';

export type StatRow = Record<string, unknown> & { _id: string };

export type QuestionStatListRes = {
  total: number;
  list: StatRow[];
};

export type HomeStatRes = {
  createdCount: number;
  publishedCount: number;
  answerCount: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseQuestionStatListRes(value: unknown): QuestionStatListRes {
  if (!isRecord(value)) return { total: 0, list: [] };

  const totalRaw = value.total;
  const listRaw = value.list;
  const total = typeof totalRaw === 'number' ? totalRaw : Number(totalRaw) || 0;

  const list: StatRow[] = [];
  if (Array.isArray(listRaw)) {
    listRaw.forEach((item) => {
      if (!isRecord(item)) return;
      const id = item._id;
      if (typeof id !== 'string') return;
      list.push({ ...(item as Record<string, unknown>), _id: id });
    });
  }

  return { total, list };
}

function parseHomeStatRes(value: unknown): HomeStatRes {
  if (!isRecord(value)) {
    return { createdCount: 0, publishedCount: 0, answerCount: 0 };
  }

  const createdRaw = value.createdCount;
  const publishedRaw = value.publishedCount;
  const answerRaw = value.answerCount;

  const createdCount =
    typeof createdRaw === 'number' ? createdRaw : Number(createdRaw) || 0;
  const publishedCount =
    typeof publishedRaw === 'number' ? publishedRaw : Number(publishedRaw) || 0;
  const answerCount =
    typeof answerRaw === 'number' ? answerRaw : Number(answerRaw) || 0;

  return { createdCount, publishedCount, answerCount };
}

// 首页统计：创建问卷数、发布问卷数、答卷总数
export async function getHomeStatService(): Promise<HomeStatRes> {
  const url = '/api/stat/overview';
  const data = (await axios.get(url)) as unknown;
  return parseHomeStatRes(data);
}

// 获取问卷的统计列表
export async function getQuestionStatListService(
  questionId: string,
  opt: {
    page: number;
    pageSize: number;
  }
): Promise<QuestionStatListRes> {
  const url = `/api/stat/${questionId}`;
  const data = (await axios.get(url, { params: opt })) as unknown;
  return parseQuestionStatListRes(data);
}

// 获取组件统计数据汇总
export async function getComponentStatStatService(
  questionId: string,
  componentId: string
): Promise<ResDataType> {
  const url = `/api/stat/${questionId}/${componentId}`;
  const data = (await axios.get(url)) as ResDataType;
  return data;
}
