/**
 * 答卷服务
 * 处理问卷回答相关的API调用
 */
import { POST } from "./ajax";

/**
 * 单个问题的回答项
 */
export interface AnswerItem {
  componentId: string;        // 组件ID
  value: string | string[];   // 回答值（单个值或多选值数组）
}

/**
 * 答卷信息
 */
export interface AnswerInfo {
  questionId: string | null;  // 问卷ID
  answerList: AnswerItem[];   // 回答列表
}

/**
 * 提交答卷
 * @param answerInfo 答卷信息
 * @returns 提交结果
 */
export async function postAnswer(answerInfo: AnswerInfo) {
  const url = "/api/answer";
  const data = await POST(url, answerInfo);
  return data;
}
