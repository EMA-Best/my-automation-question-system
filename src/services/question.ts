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
