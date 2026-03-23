/**
 * BFF 代理路由
 * 将 C 端页面的 /api/proxy/** 请求转发到后端，
 * 服务端注入 Authorization Bearer Token，浏览器永远看不到 access_token。
 *
 * 用法：
 *   前端调用 /api/proxy/templates/:id/use
 *   代理转发到 BACKEND_API_BASE/api/templates/:id/use，并附带 Bearer token
 */
import { auth } from "@/auth";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

async function proxyRequest(req: NextRequest) {
  // 1. 检查 session（确认是否已登录）
  const session = await auth();

  if (!session) {
    return NextResponse.json({ errno: 401, msg: "未登录" }, { status: 401 });
  }

  // 2. 从原始 JWT 中取出 access_token（服务端专属，不暴露给浏览器）
  const rawToken = await getToken({
    req,
    secret: process.env.AUTH_SECRET!,
  });

  const accessToken = rawToken?.accessToken as string | undefined;

  // 3. 构造转发 URL
  const pathSegments = req.nextUrl.pathname.replace("/api/proxy", "");
  const search = req.nextUrl.search;
  
  // 获取后端 API 基础地址
  const backendBase = process.env.NEXT_PUBLIC_BACKEND_API_BASE || process.env.BACKEND_API_BASE;
  if (!backendBase) {
    return NextResponse.json({ errno: 500, msg: "缺少后端 API 基础地址配置" }, { status: 500 });
  }
  
  const backendUrl = `${backendBase.trim().replace(/\/+$/, "")}/api${pathSegments}${search}`;

  // 4. 转发请求
  try {
    const backendRes = await fetch(backendUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? await req.text()
          : undefined,
    });

    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("[proxy] backend request failed:", err);
    return NextResponse.json(
      { errno: 500, msg: "服务暂时不可用，请稍后重试" },
      { status: 500 },
    );
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PATCH = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
