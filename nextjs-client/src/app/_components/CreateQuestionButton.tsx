"use client";

/**
 * @file CreateQuestionButton.tsx
 * @description 首页「创建问卷」按钮（Client Component）
 *
 * 逻辑：
 *  1) 点击后调用 C 端 BFF：POST /api/proxy/question
 *  2) 已登录：创建成功，直接跳转 B 端 /question/edit/:id
 *  3) 未登录（401）：先跳到 B 端 /login，登录完成后回跳到 C 端中转页
 *     /create-question-callback，由中转页自动创建并进入编辑页
 */

import {
  createQuestionByProxy,
  type CreateQuestionRes,
} from "@/services/question";
import { useState } from "react";

function pickQuestionId(value: CreateQuestionRes): string {
  return value.questionId || value.id || value._id || "";
}

export default function CreateQuestionButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const result = await createQuestionByProxy();
      const questionId = pickQuestionId(result);

      if (!questionId) {
        throw new Error("创建成功但未拿到问卷 ID");
      }

      const bAppOrigin =
        process.env.NEXT_PUBLIC_B_APP_ORIGIN ?? "http://localhost:3001";
      window.location.href = `${bAppOrigin}/question/edit/${questionId}`;
    } catch (err: unknown) {
      const e = err as Error & { status?: number };

      if (e.status === 401) {
        // 未登录：跳 B 端登录页，登录后回跳到 C 端中转页继续创建
        const bAppOrigin =
          process.env.NEXT_PUBLIC_B_APP_ORIGIN ?? "http://localhost:3001";
        const cAppOrigin =
          process.env.NEXT_PUBLIC_C_APP_ORIGIN ?? "http://localhost:3000";

        const callbackUrl = `${cAppOrigin}/create-question-callback?sso=1`;
        window.location.href = `${bAppOrigin}/login?callbackUrl=${encodeURIComponent(callbackUrl)}&authBase=${encodeURIComponent(cAppOrigin)}`;
        return;
      }

      setError(e.message || "创建失败，请稍后重试");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleCreate}
        disabled={loading}
        className="px-8 py-3 bg-linear-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
      >
        {loading ? "创建中..." : "创建问卷"}
      </button>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
