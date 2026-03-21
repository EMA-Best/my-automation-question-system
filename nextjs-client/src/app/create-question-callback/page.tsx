"use client";

/**
 * @file create-question-callback/page.tsx
 * @description 登录回跳后的「创建问卷中转页」
 *
 * 场景：
 *  - 首页点「创建问卷」时若未登录，会先跳 B 端登录
 *  - 登录成功后回跳到本页
 *  - 本页自动调用 POST /api/proxy/question 创建问卷
 *  - 创建成功后自动跳转 B 端编辑页
 */

import {
  createQuestionByProxy,
  type CreateQuestionRes,
} from "@/services/question";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type PageStatus = "pending" | "success" | "error";

function pickQuestionId(value: CreateQuestionRes): string {
  return value.questionId || value.id || value._id || "";
}

export default function CreateQuestionCallbackPage() {
  const [status, setStatus] = useState<PageStatus>("pending");
  const [errorMsg, setErrorMsg] = useState("");

  // 防止开发模式 StrictMode 下重复触发创建请求
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    async function run() {
      try {
        const result = await createQuestionByProxy();
        const questionId = pickQuestionId(result);

        if (!questionId) {
          throw new Error("创建成功但未拿到问卷 ID");
        }

        setStatus("success");

        const bAppOrigin =
          process.env.NEXT_PUBLIC_B_APP_ORIGIN ?? "http://localhost:3001";
        setTimeout(() => {
          window.location.href = `${bAppOrigin}/question/edit/${questionId}`;
        }, 700);
      } catch (err: unknown) {
        const e = err as Error & { status?: number };

        if (e.status === 401) {
          setErrorMsg("登录状态失效，请返回首页重新登录后再试");
        } else {
          setErrorMsg(e.message || "创建失败，请稍后重试");
        }
        setStatus("error");
      }
    }

    void run();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-10 text-center">
        {status === "pending" && (
          <>
            <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin mx-auto mb-6" />
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              正在创建问卷…
            </h1>
            <p className="text-gray-500">登录已完成，正在为你创建新问卷</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6 mx-auto ring-4 ring-green-50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-9 w-9"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#22c55e"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">创建成功！</h1>
            <p className="text-gray-500">正在进入编辑器，请稍候…</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6 mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-9 w-9"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#ef4444"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">创建失败</h1>
            <p className="text-gray-500 mb-8">{errorMsg}</p>
            <Link
              href="/"
              className="inline-block px-6 py-2.5 bg-linear-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow hover:shadow-md transition-all"
            >
              返回首页
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
