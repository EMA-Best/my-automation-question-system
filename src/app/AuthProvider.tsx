"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { useEffect } from "react";

const LOGOUT_GUARD_UNTIL_KEY = "__sso_logout_guard_until__";

/**
 * 兜底清理历史异常会话：旧数据曾把默认用户注入到 C 端 Session。
 * 命中后走静默登出，并打上 loggedOut 标记（用于后续桥接冷却）。
 */
function LegacySessionCleaner() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;

    const username = session?.user?.name ?? session?.user?.email ?? "";
    if (username !== "hele") return;

    const onceKey = "__clear_legacy_hele_session_once__";
    if (sessionStorage.getItem(onceKey) === "1") return;
    sessionStorage.setItem(onceKey, "1");

    const callback = new URL(window.location.href);
    callback.searchParams.delete("sso");
    callback.searchParams.delete("ssoTried");
    callback.searchParams.delete("ssoError");
    callback.searchParams.delete("ssoErrorDetail");
    callback.searchParams.set("loggedOut", "1");

    localStorage.setItem(LOGOUT_GUARD_UNTIL_KEY, String(Date.now() + 5000));
    const ssoSignoutUrl = new URL(
      "/api/auth/sso-signout",
      window.location.origin,
    );
    ssoSignoutUrl.searchParams.set("callbackUrl", callback.toString());
    window.location.replace(ssoSignoutUrl.toString());
  }, [status, session]);

  return null;
}

/**
 * C -> B 静默登录桥接。
 * 当 C 未登录时，通过隐藏 iframe 访问 B 的 /sso-bridge，
 * 若 B 已登录则回传 token/username，再由 C 的 sso-callback 写入会话。
 */
function CrossAppBridge() {
  const { status } = useSession();
  const BRIDGE_LAST_TS_KEY = "__c_to_b_sso_bridge_last_ts__";
  const BRIDGE_COOLDOWN_MS = 2500;

  useEffect(() => {
    if (status === "authenticated") {
      sessionStorage.removeItem(BRIDGE_LAST_TS_KEY);
      return;
    }

    if (status !== "unauthenticated") return;

    const currentUrl = new URL(window.location.href);
    if (currentUrl.pathname.startsWith("/api/auth/")) return;

    const params = currentUrl.searchParams;
    const hasTokenParams =
      params.has("token") ||
      params.has("access_token") ||
      params.has("accessToken");
    if (hasTokenParams) return;

    const guardUntil = Number(
      localStorage.getItem(LOGOUT_GUARD_UNTIL_KEY) || "0",
    );
    if (Date.now() < guardUntil) return;

    const now = Date.now();
    const lastTs = Number(sessionStorage.getItem(BRIDGE_LAST_TS_KEY) || "0");
    if (now - lastTs < BRIDGE_COOLDOWN_MS) return;
    sessionStorage.setItem(BRIDGE_LAST_TS_KEY, String(now));

    const bAppOrigin =
      process.env.NEXT_PUBLIC_B_APP_ORIGIN ?? "http://localhost:8000";
    const bOrigin = new URL(bAppOrigin).origin;

    const bridgeUrl = new URL("/sso-bridge", bAppOrigin);
    bridgeUrl.searchParams.set("origin", window.location.origin);

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== bOrigin) return;
      const data = event.data as {
        type?: string;
        status?: "ok" | "miss";
        token?: string;
        username?: string;
      };

      if (data?.type !== "B_SSO_BRIDGE_RESULT") return;

      window.removeEventListener("message", handleMessage);
      iframe.remove();

      if (data.status !== "ok" || !data.token || !data.username) {
        return;
      }

      const callback = new URL(window.location.href);
      callback.searchParams.delete("token");
      callback.searchParams.delete("access_token");
      callback.searchParams.delete("accessToken");
      callback.searchParams.delete("username");
      callback.searchParams.delete("userName");
      callback.searchParams.delete("name");

      const ssoUrl = new URL("/api/auth/sso-callback", window.location.origin);
      ssoUrl.searchParams.set("token", data.token);
      ssoUrl.searchParams.set("username", data.username);
      ssoUrl.searchParams.set("callbackUrl", callback.toString());
      window.location.replace(ssoUrl.toString());
    };

    window.addEventListener("message", handleMessage);

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = bridgeUrl.toString();
    iframe.title = "sso-bridge";
    document.body.appendChild(iframe);

    const timer = window.setTimeout(() => {
      window.removeEventListener("message", handleMessage);
      iframe.remove();
    }, 3000);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("message", handleMessage);
      iframe.remove();
    };
  }, [status]);

  return null;
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // 处理 URL 中桥接回传参数（token/username）并写入 C 端会话
  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const params = currentUrl.searchParams;

    const token =
      params.get("token") ??
      params.get("access_token") ??
      params.get("accessToken");
    const username =
      params.get("username") ?? params.get("userName") ?? params.get("name");

    if (!token || !username) return;

    params.delete("token");
    params.delete("access_token");
    params.delete("accessToken");
    params.delete("username");
    params.delete("userName");
    params.delete("name");

    const callbackUrl = currentUrl.toString();
    const ssoUrl = new URL("/api/auth/sso-callback", window.location.origin);
    ssoUrl.searchParams.set("token", token);
    ssoUrl.searchParams.set("username", username);
    ssoUrl.searchParams.set("callbackUrl", callbackUrl);

    window.location.replace(ssoUrl.toString());
  }, []);

  useEffect(() => {
    // 登出回跳时写入短时冷却，避免“刚退出又被自动桥接登录”
    const currentUrl = new URL(window.location.href);
    if (currentUrl.searchParams.get("loggedOut") !== "1") return;

    localStorage.setItem(LOGOUT_GUARD_UNTIL_KEY, String(Date.now() + 5000));

    currentUrl.searchParams.delete("loggedOut");
    window.history.replaceState({}, "", currentUrl.toString());
  }, []);

  useEffect(() => {
    // 清理历史遗留的 B 端 remember-me Cookie，避免旧账号在 C 端被静默补登。
    document.cookie = "username=; Max-Age=0; path=/";
    document.cookie = "password=; Max-Age=0; path=/";
  }, []);

  return (
    <SessionProvider>
      <LegacySessionCleaner />
      <CrossAppBridge />
      {children}
    </SessionProvider>
  );
}
