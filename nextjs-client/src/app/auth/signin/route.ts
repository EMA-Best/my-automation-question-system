/**
 * @file app/auth/signin/route.ts
 * @description 登录重定向中转 — Route Handler（替代原来的登录页面）
 *
 * 设计变更说明：
 *  统一登录入口已改为 B 端（React 管理后台），C 端不再承载登录表单 UI。
 *  但 C 端仍然是认证中心（next-auth BFF），负责签发和管理 Session Cookie。
 *
 * 工作方式：
 *  1. next-auth 内部（如 middleware 或 session 过期）触发 signIn 重定向时，
 *     会跳转到 auth.ts 中配置的 pages.signIn = '/auth/signin'。
 *  2. 本 Route Handler 拦截该 GET 请求，将其 302 重定向到 B 端登录页，
 *     并携带 callbackUrl 和 authBase 参数。
 *  3. B 端登录页收集用户名/密码 → 直接调用后端 API 验证 → 获得 access_token + username。
 *  4. B 端将用户浏览器重定向到 C 端 SSO 回调端点：
 *       ${authBase}/api/auth/sso-callback?token=<accessToken>&username=<用户名>&callbackUrl=<回跳地址>
 *  5. C 端 SSO 回调端点设置 Session Cookie → 重定向到 callbackUrl → 完成登录。
 *
 *  注意：B 端不要调用 C 端的 /api/auth/callback/credentials（跨域 Cookie 无法设置），
 *  而是直接调用后端 API 验证，然后重定向到 C 端的 /api/auth/sso-callback。
 *
 * 参数说明：
 *  ?callbackUrl=<url> — 登录成功后要回到的 C 端页面（由 next-auth 或前端代码注入）
 *
 * 环境变量依赖：
 *  NEXT_PUBLIC_B_APP_ORIGIN — B 端域名（如 http://localhost:8000）
 *  NEXT_PUBLIC_C_APP_ORIGIN — C 端域名（如 http://localhost:3000），
 *    传给 B 端作为 authBase，B 端用它拼接 SSO 回调 URL
 */
import { NextRequest, NextResponse } from "next/server";

export function GET(req: NextRequest) {
  // 从 query 中读取 callbackUrl（登录完成后要回到的 C 端页面）
  const callbackUrl = req.nextUrl.searchParams.get("callbackUrl") ?? "/";

  // B 端登录页地址
  const bAppOrigin =
    process.env.NEXT_PUBLIC_B_APP_ORIGIN ?? "http://localhost:8000";

  // C 端域名（让 B 端知道认证中心的地址，用于调用 /api/auth/* 接口）
  const cAppOrigin =
    process.env.NEXT_PUBLIC_C_APP_ORIGIN ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";

  // 构造 B 端登录页 URL，携带回调信息和认证中心地址
  // B 端登录页需要解析这些参数：
  //   callbackUrl — 登录成功后最终回跳的 C 端页面
  //   authBase    — C 端域名，B 端登录成功后用它拼接 SSO 回调 URL：
  //                 ${authBase}/api/auth/sso-callback?token=xx&username=xx&callbackUrl=xx
  const targetUrl = new URL("/login", bAppOrigin);
  targetUrl.searchParams.set("callbackUrl", callbackUrl);
  targetUrl.searchParams.set("authBase", cAppOrigin);

  // 302 临时重定向到 B 端登录页
  return NextResponse.redirect(targetUrl.toString());
}
