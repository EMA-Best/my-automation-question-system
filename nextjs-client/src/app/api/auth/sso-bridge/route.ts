import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

/**
 * 校验 access_token 是否仍可用于访问后端受保护接口。
 *
 * 返回值语义：
 * - true: token 可用，或当前环境无法可靠判断（例如缺少 BACKEND_API_BASE）
 * - false: token 明确无效（401/403）
 */
async function isBackendAccessTokenValid(
  accessToken: string,
): Promise<boolean> {
  const backendApiBase = process.env.BACKEND_API_BASE;

  // 没有后端地址时无法探测，避免误清会话
  if (!backendApiBase) return true;

  try {
    const verifyRes = await fetch(`${backendApiBase}/api/user/info`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    // 明确鉴权失败：视为 token 失效
    if (verifyRes.status === 401 || verifyRes.status === 403) {
      return false;
    }

    // 其它状态（含 2xx/5xx）先不判失效，避免后端短暂波动导致误登出
    return true;
  } catch {
    // 网络异常不直接判失效，避免误登出
    return true;
  }
}

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

  // C 有会话但 access_token 过期/失效：清理会话，返回 miss，让 B 端进入正常登录流程
  if (accessToken) {
    const valid = await isBackendAccessTokenValid(accessToken);
    if (!valid) {
      const missUrl = new URL(callbackUrl.toString());
      missUrl.searchParams.set("ssoBridge", "miss");
      const response = NextResponse.redirect(missUrl.toString());

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
  }

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
