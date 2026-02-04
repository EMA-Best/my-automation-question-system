import { NextRequest, NextResponse } from "next/server";
import { postAnswer } from "@/services/answer";

function genAnswerInfo(formData: FormData) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const answerMap: Record<string, any> = {};
  let questionId: string | null = null;

  // 使用 for...of 循环遍历 FormData 的 entries
  for (const [key, value] of formData.entries()) {
    if (key === "questionId") {
      questionId = value as string;
    } else {
      const v = value as string;
      if (answerMap[key] == null) {
        answerMap[key] = v;
      } else if (Array.isArray(answerMap[key])) {
        answerMap[key].push(v);
      } else {
        answerMap[key] = [answerMap[key], v];
      }
    }
  }

  const answerList = Object.entries(answerMap).map(([componentId, value]) => ({
    componentId,
    value,
  }));

  // 另一种方法：使用 keys() 方法获取所有键名，然后遍历键名数组
  //   const keysArr = Array.from(formData.keys());
  //   keysArr.forEach((key) => {
  //     if (key === "questionId") {
  //       questionId = formData.get("questionId") as string;
  //     } else {
  //       answerList.push({ key, value: formData.get(key) });
  //     }
  //   });

  return {
    questionId,
    answerList,
  };
}

export async function POST(request: NextRequest) {
  if (request.method !== "POST") {
    return NextResponse.json(
      { errno: -1, msg: "Method 错误" },
      { status: 200 },
    );
  }

  // 获取并格式化表单数据
  const formData = await request.formData();
  // console.log("formData:", formData);

  const answerInfo = genAnswerInfo(formData);

  try {
    // 提交到服务器Mock
    const resData = await postAnswer(answerInfo);
    // console.log("resData：", resData);
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
    return NextResponse.json(
      { errno: -2, msg: String(error) },
      { status: 500 },
    );
  }
}
