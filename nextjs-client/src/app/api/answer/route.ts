/**
 * 问卷回答API路由
 * 处理问卷提交的POST请求
 */
import { NextRequest, NextResponse } from "next/server";
import { postAnswer } from "@/services/answer";

/**
 * 从FormData中生成问卷回答信息
 * @param formData 表单数据
 * @returns 格式化后的回答信息对象
 */
function genAnswerInfo(formData: FormData) {
  // 存储回答数据的映射，key为组件ID，value为回答值
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const answerMap: Record<string, any> = {};
  let questionId: string | null = null;

  // 使用 for...of 循环遍历 FormData 的 entries
  for (const [key, value] of formData.entries()) {
    if (key === "questionId") {
      // 提取问卷ID
      questionId = value as string;
    } else {
      const v = value as string;
      // 处理多选情况，将相同key的值合并为数组
      if (answerMap[key] == null) {
        answerMap[key] = v;
      } else if (Array.isArray(answerMap[key])) {
        answerMap[key].push(v);
      } else {
        answerMap[key] = [answerMap[key], v];
      }
    }
  }

  // 将映射转换为回答列表格式
  const answerList = Object.entries(answerMap).map(([componentId, value]) => ({
    componentId,
    value,
  }));

  return {
    questionId,
    answerList,
  };
}

/**
 * 处理POST请求，提交问卷回答
 * @param request NextRequest对象
 * @returns NextResponse对象
 */
export async function POST(request: NextRequest) {
  // 检查请求方法是否为POST
  if (request.method !== "POST") {
    return NextResponse.json(
      { errno: -1, msg: "Method 错误" },
      { status: 200 },
    );
  }

  // 获取并格式化表单数据
  const formData = await request.formData();
  const answerInfo = genAnswerInfo(formData);

  try {
    // 调用服务层提交回答
    const resData = await postAnswer(answerInfo);
    
    if (resData.errno === 0) {
      // 提交成功，跳转到 success 页面
      return NextResponse.redirect(new URL("/success", request.url));
    } else {
      // 提交失败，返回处理结果
      return NextResponse.json(
        { errno: -1, msg: "提交失败，请重试" },
        { status: 500 },
      );
    }
  } catch (error) {
    // 捕获异常，返回错误信息
    return NextResponse.json(
      { errno: -2, msg: String(error) },
      { status: 500 },
    );
  }
}
