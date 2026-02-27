import { encode } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const toDetail = (value: unknown) => {
    const text = typeof value === "string" ? value : JSON.stringify(value);
    return encodeURIComponent((text || "unknown_error").slice(0, 180));
  };

  const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!authSecret) {
    return NextResponse.json(
      { error: "缺少 AUTH_SECRET 或 NEXTAUTH_SECRET" },
      { status: 500 },
    );
  }

  const backendBase = process.env.BACKEND_API_BASE;
  if (!backendBase) {
    return NextResponse.json(
      { error: "缺少 BACKEND_API_BASE" },
      { status: 500 },
    );
  }

  const callbackUrl = req.nextUrl.searchParams.get("callbackUrl") ?? "/";
  const usernameRaw = req.cookies.get("username")?.value;
  const passwordRaw = req.cookies.get("password")?.value;

  const decodeMaybe = (value?: string) => {
    if (!value) return value;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  const username = decodeMaybe(usernameRaw);
  const password = decodeMaybe(passwordRaw);

  const callback = new URL(
    callbackUrl.startsWith("http")
      ? callbackUrl
      : new URL(callbackUrl, req.nextUrl.origin).toString(),
  );
  callback.searchParams.set("ssoTried", "1");
  callback.searchParams.delete("sso");

  if (!username || !password) {
    callback.searchParams.set("ssoError", "missing_credentials_cookie");
    callback.searchParams.set(
      "ssoErrorDetail",
      toDetail(`username=${Boolean(username)} password=${Boolean(password)}`),
    );
    return NextResponse.redirect(callback.toString());
  }

  const issueSessionAndRedirect = async (
    finalUsername: string,
    accessToken?: string,
  ) => {
    const useSecureCookies = process.env.NODE_ENV === "production";
    const cookieName = useSecureCookies
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    const maxAge = 30 * 24 * 60 * 60;
    const expires = new Date(Date.now() + maxAge * 1000);

    const sessionToken = await encode({
      token: {
        sub: String(finalUsername),
        name: String(finalUsername),
        email: null,
        ...(accessToken ? { accessToken: String(accessToken) } : {}),
      },
      secret: authSecret,
      salt: cookieName,
      maxAge,
    });

    callback.searchParams.delete("ssoError");
    callback.searchParams.delete("ssoErrorDetail");
    const response = NextResponse.redirect(callback.toString());
    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: "lax",
      path: "/",
      maxAge,
      expires,
    });

    return response;
  };

  try {
    const loginRes = await fetch(`${backendBase}/api/user/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      cache: "no-store",
    });

    if (!loginRes.ok) {
      callback.searchParams.set("ssoError", "backend_login_failed");
      callback.searchParams.set(
        "ssoErrorDetail",
        toDetail(`status=${loginRes.status}`),
      );
      return NextResponse.redirect(callback.toString());
    }

    const raw = await loginRes.text();
    let json: any = null;
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      callback.searchParams.set("ssoError", "backend_response_not_json");
      callback.searchParams.set("ssoErrorDetail", toDetail(raw));
      return NextResponse.redirect(callback.toString());
    }

    const accessToken = json?.data?.token;
    const finalUsername = json?.data?.username ?? username;

    if (json?.errno !== 0 || !accessToken) {
      callback.searchParams.set("ssoError", "invalid_login_response");
      callback.searchParams.set("ssoErrorDetail", toDetail(json));
      return NextResponse.redirect(callback.toString());
    }

    return issueSessionAndRedirect(String(finalUsername), String(accessToken));
  } catch (error: unknown) {
    console.error("[sso-cookie-fallback] exception", error);
    return issueSessionAndRedirect(String(username));
  }
}
