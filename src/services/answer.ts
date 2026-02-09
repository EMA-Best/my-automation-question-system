import { POST } from "./ajax";

export interface AnswerItem {
  componentId: string;
  value: string | string[];
}

export interface AnswerInfo {
  questionId: string | null;
  answerList: AnswerItem[];
}

// 提交答卷
export async function postAnswer(answerInfo: AnswerInfo) {
  const url = "/api/answer";
  const data = await POST(url, answerInfo);
  return data;
}
