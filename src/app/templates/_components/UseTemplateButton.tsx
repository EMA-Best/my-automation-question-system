"use client";

/**
 * @file UseTemplateButton.tsx
 * @description "使用此模板"按钮 — Client Component
 *
 * 职责：
 *  1. 点击后调用 POST /api/proxy/templates/:id/use（BFF 代理，服务端注入 token）。
 *  2. 成功：拿到 questionId，跳转 B 端编辑页。
 *  3. 未登录（401）：跳转到 B 端统一登录页（`B_APP_ORIGIN/login`），
 *     并携带 callbackUrl=C端/templates/use-callback?templateId=xxx，
 *     登录完成后 B 端调用 C 端认证 API，再回跳 C 端完成"使用模板"动作。
 *  4. 其他错误（403 模板下线/500 服务异常）：在按钮旁显示友好错误提示。
 *
 * 为什么这里用 Client Component？
 *  按钮点击是客户端行为（onClick），所以必须加 'use client'。
 *  数据请求（POST /api/proxy）走的是 浏览器 → C端BFF → 后端，
 *  BFF 层在服务端注入 Bearer token，浏览器仍看不到 access_token。
 */

import { useTemplate } from "@/services/template";
import { useState } from "react";

interface UseTemplateButtonProps {
  /** 要使用的模板 ID */
  templateId: string;
  /** 按钮样式变体，默认 'default' */
  variant?: "default" | "outline";
}

export default function UseTemplateButton({
  templateId,
  variant = "default",
}: UseTemplateButtonProps) {
  // 按钮加载状态（请求进行中时禁用，防止重复提交）
  const [loading, setLoading] = useState(false);
  // 错误信息（403 等可展示给用户）
  const [error, setError] = useState("");

  async function handleUse() {
    // 防止重复点击
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      // ----------------------------------------------------------------
      // 调用 BFF 代理：POST /api/proxy/templates/:id/use
      //   - 成功：后端克隆模板，返回 { questionId }
      //   - 401：session 不存在 → useTemplate 抛出 status=401 的错误
      //   - 403：模板不可用 → useTemplate 抛出 status=403 的错误
      // ----------------------------------------------------------------
      const { questionId } = await useTemplate(templateId);

      // 跳转到 B 端编辑页
      // NEXT_PUBLIC_ 前缀的变量在客户端可见
      const bAppOrigin =
        process.env.NEXT_PUBLIC_B_APP_ORIGIN ?? "http://localhost:8000";
      window.location.href = `${bAppOrigin}/question/edit/${questionId}`;
    } catch (err: unknown) {
      const e = err as Error & { status?: number };

      if (e.status === 401) {
        // ----------------------------------------------------------------
        // 未登录处理：
        //  1. 构造 callbackUrl，指向 C 端 use-callback 页面（完整 URL）
        //  2. 跳转到 B 端统一登录页，携带 callbackUrl 和 authBase
        //  3. B 端登录页收集凭据 → 调用后端 API 验证 → 获得 token + username
        //  4. B 端重定向到 ${authBase}/api/auth/sso-callback?token=xx&username=xx&callbackUrl=xx
        //  5. C 端 SSO 回调端点设置 Session Cookie → 重定向到 use-callback 页面
        //  6. use-callback 页面自动调用 /use 接口，最终跳转到 B 端编辑页
        // ----------------------------------------------------------------
        const bAppOrigin =
          process.env.NEXT_PUBLIC_B_APP_ORIGIN ?? "http://localhost:8000";
        const cAppOrigin =
          process.env.NEXT_PUBLIC_C_APP_ORIGIN ?? "http://localhost:3000";
        // callbackUrl 必须使用完整 C 端 URL，因为是从 B 端跳回来
        const fullCallbackUrl = `${cAppOrigin}/templates/use-callback?templateId=${templateId}`;
        window.location.href = `${bAppOrigin}/login?callbackUrl=${encodeURIComponent(fullCallbackUrl)}&authBase=${encodeURIComponent(cAppOrigin)}`;
      } else if (e.status === 403) {
        setError("该模板暂不可用（已下线或无权限）");
        setLoading(false);
      } else {
        setError(e.message || "操作失败，请稍后重试");
        setLoading(false);
      }
    }
  }

  return (
    <div>
      <button
        onClick={handleUse}
        disabled={loading}
        className={
          variant === "outline"
            ? // 描边风格（用于卡片 hover 的次级按钮）
              "px-4 py-2 text-sm font-medium border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            : // 实心风格（主要操作场景）
              "px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-sm hover:shadow-md transform hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
        }
      >
        {loading ? "处理中..." : "使用此模板"}
      </button>

      {/* 错误提示（403/500 等非登录态错误） */}
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}
