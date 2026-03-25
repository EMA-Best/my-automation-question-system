"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useSession } from "next-auth/react";
import SignOutButton from "./SignOutButton";
import styles from "./index.module.scss";

export default function TopBar() {
  const { data: session } = useSession();

  const bAppOrigin =
    process.env.NEXT_PUBLIC_B_APP_ORIGIN ?? "http://localhost:8000";
  const cAppOrigin =
    process.env.NEXT_PUBLIC_C_APP_ORIGIN ?? "http://localhost:3000";

  const onLoginClick = useCallback(() => {
    // Build callback on click to keep SSR/CSR markup identical.
    const callback = new URL(window.location.href);
    callback.searchParams.set("sso", "1");
    const loginUrl = `${bAppOrigin}/login?callbackUrl=${encodeURIComponent(
      callback.toString(),
    )}&authBase=${encodeURIComponent(cAppOrigin)}`;
    window.location.href = loginUrl;
  }, [bAppOrigin, cAppOrigin]);

  return (
    <header className={styles.topbar}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <Link href="/" className={styles.brand}>
            <span className={styles.logoBox}>Q</span>
            <span className={styles.brandName}>小伦问卷</span>
          </Link>

          <nav className={styles.nav}>
            <Link href="/" className={styles.navLink}>
              首页
            </Link>
            <Link href="/templates" className={styles.navLink}>
              模板中心
            </Link>
          </nav>
        </div>

        <div className={styles.right}>
          {session?.user ? (
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                {(session.user.name ?? session.user.email ?? "?")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <span className={styles.username}>
                {session.user.name ?? session.user.email}
              </span>
              <SignOutButton />
            </div>
          ) : (
            <button
              type="button"
              onClick={onLoginClick}
              className={styles.loginBtn}
            >
              登录
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
