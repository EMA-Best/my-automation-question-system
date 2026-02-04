import { POST } from "./ajax";

// 提交答卷
export async function postAnswer(answerInfo: any) {
  const url = "/api/answer";
  const data = await POST(url, answerInfo);
  return data;
}
