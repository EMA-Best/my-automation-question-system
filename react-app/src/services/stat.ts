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

/** 单个问卷的答卷数统计 */
export type QuestionAnswerCountItem = {
  questionId: string;
  answerCount: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

/**
 * 将后端返回的各种 id 形态归一化为 string。
 *
 * 常见情况：
 * - string："66f..."
 * - number：123（少见，但做兼容）
 * - Mongo 扩展 JSON：{ $oid: "66f..." }
 */
function normalizeId(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (isRecord(value)) {
    const oid = value.$oid;
    if (typeof oid === 'string' && oid.trim().length > 0) return oid.trim();
  }
  return null;
}

/**
 * 解析批量答卷数接口返回
 * - 兼容 value 为数组 或 { list: [] }
 * - 兼容字段名：questionId / id / _id
 * - 兼容字段名：answerCount / count / total
 */
function parseQuestionAnswerCountList(
  value: unknown
): QuestionAnswerCountItem[] {
  const listRaw = Array.isArray(value)
    ? value
    : isRecord(value) && Array.isArray(value.list)
      ? value.list
      : [];

  const list: QuestionAnswerCountItem[] = [];
  listRaw.forEach((item) => {
    if (!isRecord(item)) return;
    const questionId = normalizeId(
      item.questionId ??
        item.questionnaireId ??
        item.question_id ??
        item.qid ??
        item.id ??
        item._id
    );
    if (!questionId) return;

    const answerCountRaw =
      item.answerCount ??
      item.answer_count ??
      item.count ??
      item.total ??
      item.answersCount;
    list.push({
      questionId,
      answerCount: toNumber(answerCountRaw),
    });
  });

  return list;
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

/**
 * 批量获取“问卷答卷数”
 *
 * 后端接口示例：
 * - POST /api/stat/questions/answer-count
 * - body: { questionIds: string[] }
 * - data: { list: Array<{ questionId: string; answerCount: number }> }
 */
export async function getQuestionAnswerCountBatchService(
  questionIds: string[]
): Promise<Record<string, number>> {
  const url = '/api/stat/questions/answer-count';
  const uniqueIds = Array.from(
    new Set(questionIds.filter((id) => typeof id === 'string' && id.length > 0))
  );

  // 空数组时不发请求，避免后端做无意义校验
  if (uniqueIds.length === 0) return {};

  const data = (await axios.post(url, { questionIds: uniqueIds })) as unknown;
  const list = parseQuestionAnswerCountList(data);

  // 将 list 转成 map，并保证每个请求的 id 都有值（缺失则补 0）
  const map: Record<string, number> = {};
  list.forEach((row) => {
    map[row.questionId] = row.answerCount;
  });
  uniqueIds.forEach((id) => {
    if (typeof map[id] !== 'number') map[id] = 0;
  });

  return map;
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

// AI 报告相关类型
export type GenerateAIReportPayload = {
  mode?: 'quick' | 'standard' | 'deep';
  timeRange?: 'all' | '7d' | '30d';
  includeTextAnswers?: boolean;
  maxAnswers?: number;
};

export type AIReportTaskStatus = {
  taskId: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  errorMessage?: string | null;
  report?: any;
};

// 获取最新 AI 报告
export async function getQuestionAIReportLatestService(
  questionId: string
): Promise<any> {
  const url = `/api/stat/${questionId}/ai-report/latest`;
  const data = (await axios.get(url)) as any;
  return data;
}

// 生成 AI 报告
export async function generateQuestionAIReportService(
  questionId: string,
  payload: GenerateAIReportPayload
): Promise<AIReportTaskStatus> {
  try {
    const url = `/api/stat/${questionId}/ai-report/generate`;
    console.log('创建 AI 报告任务:', url, payload);
    const data = (await axios.post(url, payload, {
      timeout: 30 * 1000,
    })) as AIReportTaskStatus;
    console.log('AI 报告任务创建成功:', data);
    return data;
  } catch (error) {
    console.error('创建 AI 报告任务失败:', error);
    throw error;
  }
}

// 查询 AI 报告任务状态
export async function getQuestionAIReportTaskStatusService(
  questionId: string,
  taskId: string
): Promise<AIReportTaskStatus> {
  const url = `/api/stat/${questionId}/ai-report/tasks/${taskId}`;
  const data = (await axios.get(url, {
    timeout: 30 * 1000,
  })) as AIReportTaskStatus;
  return data;
}

// 重新生成 AI 报告
export async function regenerateQuestionAIReportService(
  questionId: string,
  payload: GenerateAIReportPayload
): Promise<AIReportTaskStatus> {
  const url = `/api/stat/${questionId}/ai-report/regenerate`;
  const data = (await axios.post(url, payload, {
    timeout: 30 * 1000,
  })) as AIReportTaskStatus;
  return data;
}
