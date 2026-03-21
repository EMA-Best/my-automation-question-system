import { GET } from "./ajax";

export async function getQuestionById(id: string) {
  const url = `/api/question/${id}`;
  const data = await GET(url);
  return data;
}

/**
 * 获取热门问卷列表（置顶/推荐）
 * 包含题目数量和答卷数量统计
 */
export async function getFeaturedQuestions() {
  const url = `/api/questions/featured`;
  const data = await GET(url);
  return data;
}

/**
 * 获取问卷预览信息
 * @param id 问卷ID
 * @returns 问卷完整信息，包括所有题目
 */
export async function getQuestionPreview(id: string) {
  const url = `/api/questions/${id}/preview`;
  const data = await GET(url);
  return data;
}

export type CreateQuestionRes = {
  id?: string;
  _id?: string;
  questionId?: string;
};

/**
 * 通过 C 端 BFF 代理创建新问卷（需登录）
 *
 * 对应接口：POST /api/proxy/question
 * - 401：未登录
 * - 200：返回新问卷对象（通常含 _id）
 */
export async function createQuestionByProxy(): Promise<CreateQuestionRes> {
  const res = await fetch(`/api/proxy/question`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (res.status === 401) {
    const err = new Error("UNAUTHORIZED") as Error & { status: number };
    err.status = 401;
    throw err;
  }

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    const err = new Error(
      (json as { msg?: string }).msg ?? `请求失败（${res.status}）`,
    ) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  const json = await res.json();
  // 兼容后端可能返回 { data: {...} } 或直接返回对象两种结构
  return (json.data ?? json) as CreateQuestionRes;
}
