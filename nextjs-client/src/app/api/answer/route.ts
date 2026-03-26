import { NextRequest, NextResponse } from "next/server";
import { postAnswer } from "@/services/answer";

function genAnswerInfo(formData: FormData) {
  const answerMap: Record<string, string | string[]> = {};
  let questionId: string | null = null;

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

  return { questionId, answerList };
}

function getSuccessRedirectBase(request: NextRequest): URL {
  const configuredOrigin =
    process.env.NEXT_PUBLIC_C_APP_ORIGIN || process.env.NEXTAUTH_URL;

  if (configuredOrigin) {
    try {
      return new URL(configuredOrigin);
    } catch {
      // ignore invalid env and fallback to request origin
    }
  }

  return new URL(request.nextUrl.origin);
}

export async function POST(request: NextRequest) {
  if (request.method !== "POST") {
    return NextResponse.json({ errno: -1, msg: "Method 错误" }, { status: 200 });
  }

  const formData = await request.formData();
  const answerInfo = genAnswerInfo(formData);

  try {
    const resData = await postAnswer(answerInfo);

    if (resData.errno === 0) {
      return NextResponse.redirect(
        new URL("/success", getSuccessRedirectBase(request)),
      );
    }

    return NextResponse.json(
      { errno: -1, msg: "提交失败，请重试" },
      { status: 500 },
    );
  } catch (error) {
    return NextResponse.json(
      { errno: -2, msg: String(error) },
      { status: 500 },
    );
  }
}
