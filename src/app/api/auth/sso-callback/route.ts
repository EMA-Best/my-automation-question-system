/**
 * @file api/auth/sso-callback/route.ts
 * @description SSO 回调端点 — 接收 B 端登录成功后的浏览器重定向，在 C 端设置 Session Cookie
 *
 * ─── 为什么需要这个端点？──────────────────────────────
 *  B 端 (localhost:8000) 和 C 端 (localhost:3000) 是不同的 Origin。
 *  如果 B 端在自己的域上调用 C 端的 next-auth 认证接口（/api/auth/callback/credentials），
 *  返回的 Set-Cookie 头因跨域限制（SameSite=Lax / 不同端口）无法写入浏览器。
 *
 *  解决办法：B 端登录成功后，将用户浏览器 **直接重定向** 到本端点（C 端域名下），
 *  由 C 端自己发 Set-Cookie，浏览器就能正确保存 Cookie。
 *
 * ─── 完整流程 ─────────────────────────────────────────
 *  1. 用户在 C 端点击「登录」→ 302 到 B 端 /login?callbackUrl=X&authBase=C_ORIGIN
 *  2. B 端收集用户名/密码 → 调用 **后端 API** 验证 → 获得 access_token + 用户信息
 *  3. B 端将用户浏览器重定向到：
 *       GET ${authBase}/api/auth/sso-callback
 *           ?token=<access_token>
 *           &username=<用户名>
 *           &callbackUrl=<最终要回到的 C 端页面>
 *  4. 本端点：
 *       a. 读取 token / username / callbackUrl
 *       b. 使用 next-auth 的 encode() 创建加密 JWT（与 next-auth 登录产出的格式完全一致）
 *       c. 将 JWT 写入 authjs.session-token Cookie（httpOnly + Secure(prod) + SameSite=Lax）
 *       d. 302 重定向到 callbackUrl
 *  5. 用户到达 C 端目标页面，auth() 读取 Cookie → 已登录 ✓
 *
 * ─── B 端接入指南 ──────────────────────────────────────
 *  B 端登录成功后执行：
 *    const ssoUrl = new URL('/api/auth/sso-callback', authBase);
 *    ssoUrl.searchParams.set('token', backendAccessToken);
 *    ssoUrl.searchParams.set('username', loginUsername);
 *    ssoUrl.searchParams.set('callbackUrl', originalCallbackUrl);
 *    window.location.href = ssoUrl.toString();
 *
 * ─── 安全说明 ──────────────────────────────────────────
 *  - access_token 仅在一次 302 重定向的 URL 中出现，之后存入加密 httpOnly Cookie
 *  - 生产环境必须使用 HTTPS，防止 URL 中 token 被窃听
 *  - Cookie 设置 httpOnly + Secure(prod) + SameSite=Lax，前端 JS 无法读取
 *
 * ─── 环境变量依赖 ──────────────────────────────────────
 *  AUTH_SECRET   — next-auth 加密密钥，用于 JWT 加密（与 auth.ts 共享同一个）
 *  NEXTAUTH_URL  — C 端域名（用于判断是否启用 Secure Cookie）
 */

import { encode } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  // ─── 1. 读取 B 端传来的参数 ────────────────────────
  const token = searchParams.get("token"); // 后端签发的 access_token
  const username = searchParams.get("username"); // 用户名
  const callbackUrl = searchParams.get("callbackUrl") ?? "/"; // 登录后要回到的页面

  // ─── 2. 参数校验 ──────────────────────────────────
  if (!token || !username) {
    return NextResponse.json(
      {
        error: "缺少必要参数：token 和 username",
        hint: "B 端登录成功后应重定向到 /api/auth/sso-callback?token=<accessToken>&username=<用户名>&callbackUrl=<回跳地址>",
      },
      { status: 400 },
    );
  }

  // ─── 3. 确定 Cookie 配置 ──────────────────────────
  // 生产环境（HTTPS）使用 __Secure- 前缀 + secure 标志
  const useSecureCookies =
    process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;

  // Cookie 名称必须与 next-auth v5 默认一致，auth() 才能正确解密读取
  const cookieName = useSecureCookies
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  // Session 有效期：30 天（与 next-auth 默认值一致）
  const maxAge = 30 * 24 * 60 * 60;

  // ─── 4. 创建加密 JWT ─────────────────────────────
  // 使用 next-auth 的 encode() 函数，产出与正常登录完全一致的加密 Token
  // payload 结构与 auth.ts 中 jwt callback 的产出保持一致：
  //   sub         → 用户唯一标识（对应 session.user.id）
  //   name        → 用户名
  //   accessToken → 后端 access_token（仅服务端可读，不暴露给浏览器）
  const sessionToken = await encode({
    token: {
      sub: username,
      name: username,
      email: null,
      accessToken: token,
    },
    secret: process.env.AUTH_SECRET!,
    salt: cookieName, // next-auth 使用 cookie name 作为加密盐值
    maxAge,
  });

  // ─── 5. 构造重定向响应 + 设置 Session Cookie ─────
  // callbackUrl 可能是相对路径（如 "/"）或完整 URL，用 new URL() 统一处理
  const redirectTarget = callbackUrl.startsWith("http")
    ? callbackUrl
    : new URL(callbackUrl, req.nextUrl.origin).toString();

  const response = NextResponse.redirect(redirectTarget);

  // 设置 Session Cookie — 参数与 next-auth 默认配置保持严格一致
  response.cookies.set(cookieName, sessionToken, {
    httpOnly: true, // 前端 JS 不可读取
    secure: useSecureCookies, // 生产环境强制 HTTPS
    sameSite: "lax", // 允许顶级导航携带 Cookie
    path: "/", // 全站有效
    maxAge, // 过期时间 30 天
  });

  return response;
}
