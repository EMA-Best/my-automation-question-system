import { NextRequest, NextResponse } from "next/server";

function toSafeUrl(raw: string | null, origin: string): URL {
  if (!raw) return new URL("/", origin);
  try {
    return raw.startsWith("http") ? new URL(raw) : new URL(raw, origin);
  } catch {
    return new URL("/", origin);
  }
}

export async function GET(req: NextRequest) {
  const callbackRaw = req.nextUrl.searchParams.get("callbackUrl");
  const callbackUrl = toSafeUrl(callbackRaw, req.nextUrl.origin);
  callbackUrl.searchParams.set("loggedOut", "1");

  const response = NextResponse.redirect(callbackUrl.toString());

  // 同时清理开发态和生产态可能使用的会话 Cookie 名称
  response.cookies.set("authjs.session-token", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.set("__Secure-authjs.session-token", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    secure: true,
  });
  response.cookies.set("authjs.csrf-token", "", {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
