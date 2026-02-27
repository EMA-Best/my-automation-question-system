import { getToken } from "next-auth/jwt";
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
  const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!authSecret) {
    return NextResponse.json(
      { error: "缺少 AUTH_SECRET 或 NEXTAUTH_SECRET" },
      { status: 500 },
    );
  }

  const callbackRaw = req.nextUrl.searchParams.get("callbackUrl");
  const callbackUrl = toSafeUrl(callbackRaw, req.nextUrl.origin);

  const token = await getToken({
    req,
    secret: authSecret,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const accessToken =
    typeof token?.accessToken === "string" ? token.accessToken : "";
  const username =
    typeof token?.name === "string"
      ? token.name
      : typeof token?.sub === "string"
        ? token.sub
        : "";

  if (!accessToken || !username) {
    // miss: C 当前无会话，通知调用方继续走登录流程
    callbackUrl.searchParams.set("ssoBridge", "miss");
    return NextResponse.redirect(callbackUrl.toString());
  }

  // ok: 回传给 B 登录页，由 B 消费后写本地 token 并自动登录
  callbackUrl.searchParams.set("token", accessToken);
  callbackUrl.searchParams.set("username", username);
  callbackUrl.searchParams.set("ssoBridge", "ok");
  return NextResponse.redirect(callbackUrl.toString());
}
