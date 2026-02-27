import { auth } from "@/auth";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  const backendApiBase = process.env.BACKEND_API_BASE;
  const ssoError = req.nextUrl.searchParams.get("ssoError");
  const ssoErrorDetail = req.nextUrl.searchParams.get("ssoErrorDetail");

  const cookies = req.cookies.getAll().map((item) => item.name);
  const session = await auth();

  const tokenByAuthJs = authSecret
    ? await getToken({
        req,
        secret: authSecret,
        cookieName: "authjs.session-token",
        salt: "authjs.session-token",
      })
    : null;

  const tokenBySecureAuthJs = authSecret
    ? await getToken({
        req,
        secret: authSecret,
        cookieName: "__Secure-authjs.session-token",
        salt: "__Secure-authjs.session-token",
      })
    : null;

  const tokenByNextAuth = authSecret
    ? await getToken({
        req,
        secret: authSecret,
        cookieName: "next-auth.session-token",
        salt: "next-auth.session-token",
      })
    : null;

  return NextResponse.json({
    hasSecret: Boolean(authSecret),
    backendApiBase,
    ssoError,
    ssoErrorDetail,
    cookieNames: cookies,
    session,
    tokenByAuthJs,
    tokenBySecureAuthJs,
    tokenByNextAuth,
  });
}
