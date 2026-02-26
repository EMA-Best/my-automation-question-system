"use client";

/**
 * @file templates/use-callback/page.tsx
 * @description 登录回跳后"自动使用模板"的中转页 — Client Component
 *
 * 场景说明：
 *  用户在模板列表页点击"使用此模板" → BFF 返回 401（未登录）
 *  → UseTemplateButton 跳转到：
 *       /auth/signin?callbackUrl=/templates/use-callback?templateId=<id>
 *  → 用户在登录页完成登录
 *  → next-auth 将浏览器重定向回 callbackUrl，即本页面
 *  → 本页面自动触发 POST /api/proxy/templates/:id/use（此时已有 Session）
 *  → 成功：拿到 questionId，跳转 B 端编辑页
 *  → 失败：显示友好错误提示
 *
 * 为什么是 Client Component？
 *  需要在挂载时执行副作用（读 URL 参数 + 发 POST 请求），
 *  useEffect + useSearchParams 必须在客户端运行。
 *
 * 安全说明：
 *  POST 请求指向 /api/proxy，由 BFF 服务端校验 Session 并注入 Bearer Token，
 *  浏览器不接触 access_token。
 */

import { useTemplate } from "@/services/template";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

// -------------------------------------------------------
// 页面状态枚举
// -------------------------------------------------------
type PageStatus =
  | "pending" // 正在调用 /use 接口
  | "success" // 成功，即将跳转
  | "error" // 失败（403/500 等）
  | "missing"; // URL 中没有 templateId 参数

function UseCallbackContent() {
  const searchParams = useSearchParams();
  // 从 URL Query 中读取 templateId，例如：?templateId=tpl_1
  const templateId = searchParams.get("templateId");

  const [status, setStatus] = useState<PageStatus>(
    templateId ? "pending" : "missing",
  );
  const [errorMsg, setErrorMsg] = useState("");

  // -------------------------------------------------------
  // 使用 useRef 防止 React StrictMode 在开发环境下
  // 双重挂载（double-invoke）导致的重复 POST 请求
  // -------------------------------------------------------
  const calledRef = useRef(false);

  useEffect(() => {
    // 没有 templateId，直接显示错误态，不发请求
    if (!templateId) return;
    // 防重复请求
    if (calledRef.current) return;
    calledRef.current = true;

    async function doUse() {
      try {
        // ----------------------------------------------------------------
        // 调用 BFF 代理：POST /api/proxy/templates/:id/use
        //  此时用户已登录（next-auth 设置了 Session Cookie），
        //  BFF 会从服务端 JWT 取出 access_token 并注入 Authorization Header。
        // ----------------------------------------------------------------
        const { questionId } = await useTemplate(templateId!);

        setStatus("success");

        // 跳转到 B 端编辑页（直接用 window.location 触发完整跳域跳转）
        const bAppOrigin =
          process.env.NEXT_PUBLIC_B_APP_ORIGIN ?? "http://localhost:3001";

        // 稍作延迟，让用户看到"成功"状态提示，避免跳转过快感觉突兀
        setTimeout(() => {
          window.location.href = `${bAppOrigin}/question/edit/${questionId}`;
        }, 800);
      } catch (err: unknown) {
        const e = err as Error & { status?: number };

        if (e.status === 401) {
          // 理论上登录后重定向到本页，不应再 401；
          // 若仍然 401，说明 Session 可能已失效，引导重新登录
          setErrorMsg("登录状态已失效，请重新登录后再试");
        } else if (e.status === 403) {
          setErrorMsg("该模板已下线或暂无权限使用，请返回选择其他模板");
        } else {
          setErrorMsg(e.message || "操作失败，请返回重试");
        }
        setStatus("error");
      }
    }

    doUse();
  }, [templateId]);

  // -------------------------------------------------------
  // 渲染不同状态的 UI
  // -------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 p-10 text-center">
        {/* ---- 参数缺失 ---- */}
        {status === "missing" && (
          <>
            <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-6 mx-auto">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">参数错误</h1>
            <p className="text-gray-500 mb-8">
              未找到模板 ID，请返回模板列表重新选择
            </p>
            <Link
              href="/templates"
              className="inline-block px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow hover:shadow-md transition-all"
            >
              返回模板列表
            </Link>
          </>
        )}

        {/* ---- 处理中 ---- */}
        {status === "pending" && (
          <>
            {/* 旋转加载圆圈 */}
            <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin mx-auto mb-6" />
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              正在创建问卷…
            </h1>
            <p className="text-gray-500">
              已登录成功，正在将模板克隆到您的问卷列表
            </p>
          </>
        )}

        {/* ---- 成功，即将跳转 ---- */}
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
            <p className="text-gray-500">正在跳转到编辑器，请稍候…</p>
          </>
        )}

        {/* ---- 错误 ---- */}
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
            <h1 className="text-xl font-bold text-gray-800 mb-2">操作失败</h1>
            <p className="text-gray-500 mb-8">{errorMsg}</p>
            <Link
              href="/templates"
              className="inline-block px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow hover:shadow-md transition-all"
            >
              返回模板列表
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * 页面导出（必须用 Suspense 包裹 useSearchParams，否则 Next.js 会抛错）
 * @see https://nextjs.org/docs/app/api-reference/functions/use-search-params#with-suspense
 */
export default function UseCallbackPage() {
  return (
    <Suspense
      fallback={
        // Suspense fallback：useSearchParams 解析完成之前的加载占位
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin" />
        </div>
      }
    >
      <UseCallbackContent />
    </Suspense>
  );
}
