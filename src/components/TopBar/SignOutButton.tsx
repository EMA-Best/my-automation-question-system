"use client";

/**
 * @file SignOutButton.tsx
 * @description 登出按钮 — Client Component
 *
 * 为什么单独拆出来？
 * next-auth v5 的 signOut() 是一个 Server Action / 表单提交，
 * 而按钮的点击事件属于客户端行为，所以需要在 Client Component 中调用 signOut()。
 * 父组件 TopBar（Server Component）只负责读 Session，登出操作委托给这里。
 */

interface SignOutButtonProps {
  /** 按钮文案，默认"退出登录" */
  label?: string;
}

export default function SignOutButton({
  label = "退出登录",
}: SignOutButtonProps) {
  const handleSignOut = () => {
    const LOGOUT_GUARD_UNTIL_KEY = "__sso_logout_guard_until__";

    const cOrigin =
      (typeof window !== "undefined" ? window.location.origin : "") ||
      process.env.NEXT_PUBLIC_C_APP_ORIGIN ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";
    const bOrigin =
      process.env.NEXT_PUBLIC_B_APP_ORIGIN || "http://localhost:8000";

    localStorage.setItem(LOGOUT_GUARD_UNTIL_KEY, String(Date.now() + 5000));

    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete("token");
    currentUrl.searchParams.delete("access_token");
    currentUrl.searchParams.delete("accessToken");
    currentUrl.searchParams.delete("username");
    currentUrl.searchParams.delete("userName");
    currentUrl.searchParams.delete("name");

    const cSignoutUrl = new URL("/api/auth/sso-signout", cOrigin);
    cSignoutUrl.searchParams.set("callbackUrl", currentUrl.toString());

    const bLogoutBridgeUrl = new URL("/sso-logout", bOrigin);
    bLogoutBridgeUrl.searchParams.set("silent", "1");
    bLogoutBridgeUrl.searchParams.set("origin", cOrigin);

    const bOriginOnly = new URL(bOrigin).origin;
    const redirectToCSignout = () => {
      window.location.href = cSignoutUrl.toString();
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== bOriginOnly) return;
      const data = event.data as {
        type?: string;
        status?: "ok" | "miss";
      };
      if (data?.type !== "B_SSO_LOGOUT_RESULT") return;

      window.removeEventListener("message", handleMessage);
      iframe.remove();
      window.clearTimeout(timeoutTimer);
      // B 端 token 清理完成后，再清理 C 端会话，实现单点退出
      redirectToCSignout();
    };

    window.addEventListener("message", handleMessage);

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = bLogoutBridgeUrl.toString();
    iframe.title = "sso-logout-bridge";
    document.body.appendChild(iframe);

    const timeoutTimer = window.setTimeout(() => {
      window.removeEventListener("message", handleMessage);
      iframe.remove();
      redirectToCSignout();
    }, 1500);
  };

  return (
    <button
      onClick={handleSignOut}
      className="px-4 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
    >
      {label}
    </button>
  );
}
