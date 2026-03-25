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

  const clearCookie = (name: string) => {
    const secure = name.startsWith("__Secure-") || name.startsWith("__Host-");
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      secure,
    });
  };

  // Clear common names first.
  [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "authjs.csrf-token",
    "__Host-authjs.csrf-token",
    "next-auth.csrf-token",
    "__Host-next-auth.csrf-token",
  ].forEach(clearCookie);

  // Also clear chunked session cookies (e.g. __Secure-authjs.session-token.0/.1/...).
  for (const { name } of req.cookies.getAll()) {
    if (
      name.startsWith("authjs.session-token") ||
      name.startsWith("__Secure-authjs.session-token") ||
      name.startsWith("next-auth.session-token") ||
      name.startsWith("__Secure-next-auth.session-token")
    ) {
      clearCookie(name);
    }
  }

  return response;
}
