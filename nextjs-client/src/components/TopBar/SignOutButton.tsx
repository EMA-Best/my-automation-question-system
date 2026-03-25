"use client";

interface SignOutButtonProps {
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

    // Final step: clear C session and return to current C page with loggedOut=1.
    const cSignoutUrl = new URL("/api/auth/sso-signout", cOrigin);
    cSignoutUrl.searchParams.set("callbackUrl", currentUrl.toString());

    // Strong SLO path: top-level navigate to B logout first (clear B token in first-party context),
    // then B redirects back to C signout URL to clear C session.
    const bLogoutUrl = new URL("/sso-logout", bOrigin);
    bLogoutUrl.searchParams.set("callbackUrl", cSignoutUrl.toString());

    window.location.href = bLogoutUrl.toString();
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
