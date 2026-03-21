/**
 * @file app/api/auth/[...nextauth]/route.ts
 * @description next-auth v5 App Router 处理器
 *
 * 将 next-auth 内置的所有 HTTP 处理函数挂载到 Next.js App Router，
 * 一行代码自动提供以下路由（由 next-auth 内部实现，无需手动编写）：
 *
 *   GET  /api/auth/signin              - 登录入口，触发 Provider 登录流程
 *                                        （已被 pages.signIn = '/auth/signin' 覆盖为自定义页面）
 *   GET  /api/auth/callback/:provider  - OIDC/OAuth 回调，服务端完成 code→token 交换
 *                                        access_token 仅存于服务端加密 JWT，不落浏览器
 *   POST /api/auth/signout             - 登出，清除 httpOnly Session Cookie
 *   GET  /api/auth/session             - 返回当前用户 Session（脱敏，不含 accessToken）
 *                                        B 端可跨域调用此路由查询登录状态
 *
 * 所有实现细节见 src/auth.ts 的 NextAuth() 配置。
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
