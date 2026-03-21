import axios from './ajax';

import type { AuditStatus, ReviewStatus } from '../types/audit';
import { parseQuestionDetailRes, type QuestionDetail } from './question';
import { getQuestionAnswerCountBatchService } from './stat';

export type { AuditStatus, ReviewStatus };
export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'disabled';

export type OwnerInfo = {
  username: string;
  nickname: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getFirstString(
  record: Record<string, unknown>,
  keys: string[]
): string {
  for (const key of keys) {
    const v = record[key];
    if (typeof v === 'string') return v;
  }
  return '';
}

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

function normalizeKeyword(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function getFirstId(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const v = record[key];
    if (typeof v === 'string') return v;
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  return '';
}

function getFirstRecord(
  record: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> | null {
  for (const key of keys) {
    const v = record[key];
    if (isRecord(v)) return v;
  }
  return null;
}

function isAuditStatus(value: unknown): value is AuditStatus {
  return (
    value === 'Draft' ||
    value === 'PendingReview' ||
    value === 'Approved' ||
    value === 'Rejected'
  );
}

function isReviewStatus(value: unknown): value is ReviewStatus {
  return (
    value === 'PendingReview' || value === 'Approved' || value === 'Rejected'
  );
}

function normalizeReviewStatus(value: unknown): ReviewStatus {
  if (value === 'Pending') return 'PendingReview';
  if (isReviewStatus(value)) return value;
  return 'PendingReview';
}

function parseOwnerInfo(value: unknown): OwnerInfo {
  if (typeof value === 'string') {
    // 部分后端可能只返回 userId/ownerId
    return { username: value, nickname: '' };
  }
  if (!isRecord(value)) return { username: '', nickname: '' };

  const nested = getFirstRecord(value, [
    'owner',
    'user',
    'author',
    'submitter',
    'createdBy',
  ]);
  if (nested) return parseOwnerInfo(nested);

  const username = getFirstString(value, [
    'username',
    'userName',
    'account',
    'userId',
    'ownerId',
    'submitterId',
    'createdById',
  ]);
  const nickname = getFirstString(value, [
    'nickname',
    'nickName',
    'displayName',
    'userNickname',
    'ownerNickname',
    'submitterNickname',
    'createdByName',
    'ownerName',
    'submitterName',
  ]);

  return { username, nickname };
}

export type AdminQuestionListItem = {
  id: string;
  title: string;
  /**
   * 作者（接口原始 author 值，如 mikasa）。
   * 之所以用 string：列表页可直接用 Table 的 dataIndex 展示。
   */
  author: string;
  isPublished: boolean;
  isTemplate?: boolean; // 是否为模板（用于判断"已转为模板"状态）
  auditStatus: AuditStatus;
  pinned: boolean;
  featured: boolean;
  answerCount: number;
  createdAt: string;
};

/**
 * 答卷数缓存（会话级）：
 * - 目的：避免在列表页翻页/筛选时重复查询相同问卷的答卷数
 * - 注意：这是纯前端缓存，刷新页面即失效
 */
const answerCountCache = new Map<string, number>();

async function enrichAnswerCountForList<
  T extends { id: string; answerCount: number },
>(list: T[]): Promise<T[]> {
  if (list.length === 0) return list;

  const ids = list.map((item) => item.id).filter(Boolean);
  const toFetch = ids.filter((id) => !answerCountCache.has(id));

  if (toFetch.length > 0) {
    try {
      const fetched = await getQuestionAnswerCountBatchService(toFetch);
      Object.entries(fetched).forEach(([id, count]) => {
        answerCountCache.set(id, count);
      });
    } catch {
      // 统计接口失败时不阻塞列表展示：answerCount 保持 0（或旧值）
    }
  }

  return list.map((item) => {
    const cached = answerCountCache.get(item.id);
    return {
      ...item,
      answerCount: typeof cached === 'number' ? cached : item.answerCount,
    };
  });
}

export type AdminQuestionListRes = {
  list: AdminQuestionListItem[];
  count: number;
  page: number;
  pageSize: number;
};

export type GetAdminQuestionListParams = {
  page: number;
  pageSize: number;
  keyword?: string;
  authorKeyword?: string;
  isPublished?: boolean;
  auditStatus?: AuditStatus;
  featured?: boolean;
  pinned?: boolean;
};

export async function getAdminQuestionListService(
  params: GetAdminQuestionListParams
): Promise<AdminQuestionListRes> {
  const url = '/api/admin/questions';
  // 后端实际字段：query 使用 author
  const { authorKeyword, keyword, ...restParams } = params;
  const requestParams: Record<string, unknown> = {
    ...restParams,
    keyword: normalizeKeyword(keyword),
    author: normalizeKeyword(authorKeyword),
    // 兼容旧实现：部分后端仍使用 ownerKeyword
    ownerKeyword: normalizeKeyword(authorKeyword),
  };
  const data = (await axios.get(url, { params: requestParams })) as unknown;
  if (!isRecord(data)) {
    return {
      list: [],
      count: 0,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  const listRaw = data.list;
  const countRaw = data.count;
  const pageRaw = data.page;
  const pageSizeRaw = data.pageSize;

  const count = typeof countRaw === 'number' ? countRaw : Number(countRaw) || 0;
  const page =
    typeof pageRaw === 'number' ? pageRaw : Number(pageRaw) || params.page;
  const pageSize =
    typeof pageSizeRaw === 'number'
      ? pageSizeRaw
      : Number(pageSizeRaw) || params.pageSize;

  const list: AdminQuestionListItem[] = [];
  if (Array.isArray(listRaw)) {
    listRaw.forEach((item) => {
      if (!isRecord(item)) return;

      const idRaw = item.id ?? item._id;
      const titleRaw =
        item.title ??
        item.questionTitle ??
        getFirstRecord(item, ['question'])?.title;
      if (typeof idRaw !== 'string') return;
      const title = typeof titleRaw === 'string' ? titleRaw : '';

      // 关键：author 使用接口返回的“原始字段值”（如 mikasa）
      const author = typeof item.author === 'string' ? item.author : '';

      list.push({
        id: idRaw,
        title,
        author,
        isPublished: Boolean(item.isPublished),
        isTemplate: Boolean(item.isTemplate),
        auditStatus: isAuditStatus(item.auditStatus)
          ? item.auditStatus
          : 'Draft',
        pinned: Boolean(item.pinned),
        featured: Boolean(item.featured),
        // 注意：答卷数来自聚合统计，列表接口常常无法直接给出；这里统一用批量统计接口补齐
        answerCount: 0,
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
      });
    });
  }

  const enrichedList = await enrichAnswerCountForList(list);
  return { list: enrichedList, count, page, pageSize };
}

export async function publishAdminQuestionService(
  questionId: string
): Promise<void> {
  const url = `/api/admin/questions/${questionId}/publish`;
  await axios.patch(url);
}

export async function unpublishAdminQuestionService(
  questionId: string
): Promise<void> {
  const url = `/api/admin/questions/${questionId}/unpublish`;
  await axios.patch(url);
}

export type UpdateAdminQuestionFeaturePayload = {
  featured?: boolean;
  pinned?: boolean;
};

export async function updateAdminQuestionFeatureService(
  questionId: string,
  payload: UpdateAdminQuestionFeaturePayload
): Promise<void> {
  const url = `/api/admin/questions/${questionId}/feature`;
  await axios.patch(url, payload);
}

export type SoftDeleteAdminQuestionPayload = {
  reason?: string;
};

export async function softDeleteAdminQuestionService(
  questionId: string,
  payload: SoftDeleteAdminQuestionPayload
): Promise<void> {
  const url = `/api/admin/questions/${questionId}/delete`;
  await axios.patch(url, payload);
}

export type AdminDeletedQuestionListItem = {
  id: string;
  title: string;
  /** 作者（接口原始 author 值，如 mikasa） */
  author: string;
  isPublished: boolean;
  pinned: boolean;
  featured: boolean;
  answerCount: number;
  createdAt: string;
  deletedAt: string;
  deletedBy: OwnerInfo;
  deleteReason: string;
};

export type AdminDeletedQuestionListRes = {
  list: AdminDeletedQuestionListItem[];
  count: number;
  page: number;
  pageSize: number;
};

export type GetAdminDeletedQuestionListParams = {
  page: number;
  pageSize: number;
  keyword?: string;
  authorKeyword?: string;
  deletedByKeyword?: string;
  deleteReasonKeyword?: string;
  deletedAtStart?: string;
  deletedAtEnd?: string;
};

function parseAdminDeletedQuestionListItem(
  item: Record<string, unknown>
): AdminDeletedQuestionListItem | null {
  const idRaw = item.id ?? item._id;
  if (typeof idRaw !== 'string') return null;

  const questionInfo = getFirstRecord(item, ['question', 'questionnaire']);
  const titleRaw =
    item.title ??
    item.questionTitle ??
    questionInfo?.title ??
    getFirstRecord(item, ['question'])?.title;
  const title = typeof titleRaw === 'string' ? titleRaw : '';

  // 回收站作者同样取接口原始 author，不依赖 owner 字段
  const author = typeof item.author === 'string' ? item.author : '';

  const deletedByRaw =
    item.deletedBy ??
    item.deleteBy ??
    item.operator ??
    item.admin ??
    item.updatedBy;

  const deleteReasonRaw =
    item.deleteReason ?? item.deletedReason ?? item.reason ?? item.deleteRemark;
  const deleteReason =
    typeof deleteReasonRaw === 'string' ? deleteReasonRaw : '';

  const deletedAtRaw = item.deletedAt ?? item.deleteAt ?? item.updatedAt;
  const deletedAt = typeof deletedAtRaw === 'string' ? deletedAtRaw : '';

  const createdAtRaw = item.createdAt;
  const createdAt = typeof createdAtRaw === 'string' ? createdAtRaw : '';

  const statInfo = getFirstRecord(item, ['stat', 'stats', 'summary']);
  const nestedStatInfo = questionInfo
    ? getFirstRecord(questionInfo, ['stat', 'stats', 'summary'])
    : null;
  const answerCountRaw =
    item.answerCount ??
    item.answer_count ??
    item.answersCount ??
    item.answerTotal ??
    item.responseCount ??
    item.responsesCount ??
    item.submitCount ??
    item.submissionCount ??
    statInfo?.answerCount ??
    statInfo?.responseCount ??
    nestedStatInfo?.answerCount ??
    nestedStatInfo?.responseCount ??
    questionInfo?.answerCount ??
    questionInfo?.answer_count ??
    questionInfo?.answersCount ??
    questionInfo?.responseCount ??
    getFirstNumber(item, ['answerCount', 'responseCount', 'submitCount']);

  return {
    id: idRaw,
    title,
    author,
    isPublished: Boolean(item.isPublished),
    pinned: Boolean(item.pinned),
    featured: Boolean(item.featured),
    answerCount:
      typeof answerCountRaw === 'number'
        ? answerCountRaw
        : Number(answerCountRaw) || 0,
    createdAt,
    deletedAt,
    deletedBy: parseOwnerInfo(deletedByRaw),
    deleteReason,
  };
}

export async function getAdminDeletedQuestionListService(
  params: GetAdminDeletedQuestionListParams
): Promise<AdminDeletedQuestionListRes> {
  const url = '/api/admin/questions/deleted';
  // 后端实际字段：query 使用 author
  const {
    authorKeyword,
    keyword,
    deletedByKeyword,
    deleteReasonKeyword,
    ...rest
  } = params;
  const requestParams: Record<string, unknown> = {
    ...rest,
    keyword: normalizeKeyword(keyword),
    // 兼容：不同后端可能使用 author 或 authorKeyword
    author: normalizeKeyword(authorKeyword),
    authorKeyword: normalizeKeyword(authorKeyword),
    // 兼容旧实现：部分后端仍使用 ownerKeyword
    ownerKeyword: normalizeKeyword(authorKeyword),
    deletedByKeyword: normalizeKeyword(deletedByKeyword),
    deleteReasonKeyword: normalizeKeyword(deleteReasonKeyword),
  };
  const data = (await axios.get(url, { params: requestParams })) as unknown;

  if (!isRecord(data)) {
    return {
      list: [],
      count: 0,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  const listRaw = data.list;
  const countRaw = data.count;
  const pageRaw = data.page;
  const pageSizeRaw = data.pageSize;

  const count = typeof countRaw === 'number' ? countRaw : Number(countRaw) || 0;
  const page =
    typeof pageRaw === 'number' ? pageRaw : Number(pageRaw) || params.page;
  const pageSize =
    typeof pageSizeRaw === 'number'
      ? pageSizeRaw
      : Number(pageSizeRaw) || params.pageSize;

  const list: AdminDeletedQuestionListItem[] = [];
  if (Array.isArray(listRaw)) {
    listRaw.forEach((item) => {
      if (!isRecord(item)) return;
      const parsed = parseAdminDeletedQuestionListItem(item);
      if (parsed) list.push(parsed);
    });
  }

  // 回收站列表不展示答卷数据，避免触发批量答卷数统计接口
  return { list, count, page, pageSize };
}

export async function restoreAdminQuestionService(
  questionId: string
): Promise<void> {
  const url = `/api/admin/questions/${questionId}/restore`;
  await axios.patch(url);
}

export async function hardDeleteAdminQuestionService(
  questionId: string
): Promise<void> {
  const url = `/api/admin/questions/${questionId}/permanent`;
  await axios.delete(url);
}

export type AdminReviewListItem = {
  questionId: string;
  title: string;
  owner: OwnerInfo;
  status: ReviewStatus;
  submittedAt: string;
};

export type AdminReviewListRes = {
  list: AdminReviewListItem[];
  count: number;
  page: number;
  pageSize: number;
};

export type GetAdminReviewListParams = {
  page: number;
  pageSize: number;
  keyword?: string;
  status?: ReviewStatus;
};

type BackendReviewStatus = 'pending' | 'approved' | 'rejected';

function toBackendReviewStatus(
  status?: ReviewStatus
): BackendReviewStatus | undefined {
  if (!status) return undefined;
  if (status === 'PendingReview') return 'pending';
  if (status === 'Approved') return 'approved';
  return 'rejected';
}

export async function getAdminReviewListService(
  params: GetAdminReviewListParams
): Promise<AdminReviewListRes> {
  const url = '/api/admin/reviews';
  const backendParams = {
    ...params,
    status: toBackendReviewStatus(params.status),
  };
  const data = (await axios.get(url, { params: backendParams })) as unknown;

  if (!isRecord(data)) {
    return {
      list: [],
      count: 0,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  const listRaw = data.list;
  const countRaw = data.count;
  const pageRaw = data.page;
  const pageSizeRaw = data.pageSize;

  const count = typeof countRaw === 'number' ? countRaw : Number(countRaw) || 0;
  const page =
    typeof pageRaw === 'number' ? pageRaw : Number(pageRaw) || params.page;
  const pageSize =
    typeof pageSizeRaw === 'number'
      ? pageSizeRaw
      : Number(pageSizeRaw) || params.pageSize;

  const list: AdminReviewListItem[] = [];
  if (Array.isArray(listRaw)) {
    listRaw.forEach((item) => {
      if (!isRecord(item)) return;
      const questionInfo = getFirstRecord(item, ['question', 'questionnaire']);

      // 注意：很多后端会把 review.id 作为 id；预览需要的是问卷 id
      const questionIdFromNested = questionInfo
        ? getFirstId(questionInfo, ['_id', 'id'])
        : '';
      const questionIdFromItem =
        typeof item.question === 'string'
          ? item.question
          : typeof item.questionnaire === 'string'
            ? item.questionnaire
            : '';

      const questionId =
        questionIdFromNested ||
        getFirstId(item, [
          'questionId',
          'questionID',
          'question_id',
          'questionnaireId',
          'questionnaireID',
          'questionnaire_id',
        ]) ||
        questionIdFromItem;

      if (!questionId) return;

      const titleRaw =
        item.title ?? item.questionTitle ?? questionInfo?.title ?? item.name;
      const title = typeof titleRaw === 'string' ? titleRaw : '';

      const ownerRaw =
        item.owner ??
        item.user ??
        item.author ??
        item.submitter ??
        questionInfo?.owner ??
        questionInfo?.user;

      const status = normalizeReviewStatus(item.status ?? item.reviewStatus);
      const submittedAt =
        typeof (item.submittedAt ?? item.createdAt ?? item.updatedAt) ===
        'string'
          ? String(item.submittedAt ?? item.createdAt ?? item.updatedAt)
          : '';

      list.push({
        questionId,
        title,
        owner: parseOwnerInfo(ownerRaw),
        status,
        submittedAt,
      });
    });
  }

  return { list, count, page, pageSize };
}

export async function approveAdminReviewService(
  questionId: string,
  options?: { autoPublish?: boolean }
): Promise<void> {
  const url = `/api/admin/reviews/${questionId}/approve`;
  await axios.post(url, options ?? {});
}

export async function rejectAdminReviewService(
  questionId: string,
  payload: { reason: string }
): Promise<void> {
  const url = `/api/admin/reviews/${questionId}/reject`;
  await axios.post(url, payload);
}

// 管理员获取问卷详情（用于审核预览，允许未发布/未公开的问卷）
export async function getAdminQuestionDetailService(
  questionId: string
): Promise<QuestionDetail> {
  const urls = [
    `/api/admin/questions/${questionId}`,
    `/api/admin/question/${questionId}`,
  ];
  let lastError: unknown;
  for (const url of urls) {
    try {
      const data = (await axios.get(url)) as unknown;
      return parseQuestionDetailRes(data);
    } catch (err) {
      lastError = err;
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error('加载问卷详情失败');
}

export type AdminUserListItem = {
  id: string;
  username: string;
  nickname: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string;
};

export type AdminUserListRes = {
  list: AdminUserListItem[];
  count: number;
  page: number;
  pageSize: number;
};

export type GetAdminUserListParams = {
  page: number;
  pageSize: number;
  keyword?: string;
  role?: UserRole;
  status?: UserStatus;
};

function isUserRole(value: unknown): value is UserRole {
  return value === 'user' || value === 'admin';
}

function isUserStatus(value: unknown): value is UserStatus {
  return value === 'active' || value === 'disabled';
}

function parseAdminUserListItem(value: unknown): AdminUserListItem | null {
  if (!isRecord(value)) return null;

  const id = getFirstId(value, ['id', '_id', 'userId']);
  if (!id) return null;

  const username = getFirstString(value, ['username', 'userName', 'account']);
  const nickname = getFirstString(value, ['nickname', 'nickName', 'name']);
  const roleRaw = value.role;
  const statusRaw = value.status;

  return {
    id,
    username,
    nickname,
    role: isUserRole(roleRaw) ? roleRaw : 'user',
    status: isUserStatus(statusRaw) ? statusRaw : 'active',
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : '',
    lastLoginAt:
      typeof value.lastLoginAt === 'string' ? value.lastLoginAt : undefined,
  };
}

export async function getAdminUserListService(
  params: GetAdminUserListParams
): Promise<AdminUserListRes> {
  const url = '/api/admin/users';
  const data = (await axios.get(url, { params })) as unknown;

  if (!isRecord(data)) {
    return {
      list: [],
      count: 0,
      page: params.page,
      pageSize: params.pageSize,
    };
  }

  const listRaw = data.list;
  const countRaw = data.count;
  const pageRaw = data.page;
  const pageSizeRaw = data.pageSize;

  const count = typeof countRaw === 'number' ? countRaw : Number(countRaw) || 0;
  const page =
    typeof pageRaw === 'number' ? pageRaw : Number(pageRaw) || params.page;
  const pageSize =
    typeof pageSizeRaw === 'number'
      ? pageSizeRaw
      : Number(pageSizeRaw) || params.pageSize;

  const list: AdminUserListItem[] = [];
  if (Array.isArray(listRaw)) {
    listRaw.forEach((item) => {
      const parsed = parseAdminUserListItem(item);
      if (!parsed) return;
      list.push(parsed);
    });
  }

  return { list, count, page, pageSize };
}

export async function updateAdminUserStatusService(
  userId: string,
  status: UserStatus
): Promise<void> {
  const url = `/api/admin/users/${userId}/status`;
  await axios.patch(url, { status });
}

export async function updateAdminUserRoleService(
  userId: string,
  role: UserRole
): Promise<void> {
  const url = `/api/admin/users/${userId}/role`;
  await axios.patch(url, { role });
}

export type ResetPasswordStrategy = 'random' | 'default';

export type ResetPasswordRes = {
  newPassword?: string;
  mustChangePassword?: boolean;
};

function parseResetPasswordRes(value: unknown): ResetPasswordRes {
  if (!isRecord(value)) return {};
  const newPassword = value.newPassword;
  const mustChangePassword = value.mustChangePassword;
  return {
    newPassword: typeof newPassword === 'string' ? newPassword : undefined,
    mustChangePassword:
      typeof mustChangePassword === 'boolean' ? mustChangePassword : undefined,
  };
}

export async function resetAdminUserPasswordService(
  userId: string,
  strategy: ResetPasswordStrategy = 'random'
): Promise<ResetPasswordRes> {
  const url = `/api/admin/users/${userId}/reset-password`;
  const data = (await axios.post(url, { strategy })) as unknown;
  return parseResetPasswordRes(data);
}

export async function deleteAdminUserService(userId: string): Promise<void> {
  const url = `/api/admin/users/${userId}`;
  await axios.delete(url);
}
