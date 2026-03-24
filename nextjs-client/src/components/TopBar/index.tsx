"use client";

/**
 * @file TopBar/index.tsx
 * @description 全局顶部状态栏 — Client Component
 *
 * 职责：
 *  1. 通过 next-auth 的 useSession() 在客户端读取当前 Session。
 *  2. 已登录：显示用户名 + "退出登录"按钮。
 *  3. 未登录：显示"登录"按钮，点击跳转到 B 端统一登录页（`B_APP_ORIGIN/login`）。
 *  4. 显示站点导航（首页 / 模板中心）。
 *
 * 使用范围：
 *  在【除问卷填写页（/question/[id]）和填写成功页（/success）以外】的所有页面顶部引入。
 *  填写页和成功页使用 PageWrapper，不引入此组件，保持纯净的答题体验。
 *
 * 设计原则：
 *  - 本组件为 Client Component，登录态可在登录回跳后实时刷新。
 *  - 登出按钮保持拆分，复用现有交互样式。
 */

import Link from "next/link";
import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";
import SignOutButton from "./SignOutButton";
import styles from "./index.module.scss";

/**
 * 顶部导航栏
 *
 * @example — 在首页中使用
 * import TopBar from '@/components/TopBar';
 * export default function Home() {
 *   return (
 *     <>
 *       <TopBar />
 *       <main>...</main>
 *     </>
 *   );
 * }
 */
export default function TopBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const bAppOrigin =
    process.env.NEXT_PUBLIC_B_APP_ORIGIN ?? "http://localhost:8000";
  // Keep SSR and first client render deterministic to avoid hydration mismatch.
  const cAppOrigin =
    process.env.NEXT_PUBLIC_C_APP_ORIGIN ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";
  const loginCallbackUrl = useMemo(() => {
    // 动态回传：登录后回到用户当前所在页面（而非固定首页）
    const callback = new URL(pathname || "/", cAppOrigin);
    const rawSearch = searchParams?.toString();

    if (rawSearch) {
      callback.search = rawSearch;
    }
    callback.searchParams.set("sso", "1");

    return callback.toString();
  }, [cAppOrigin, pathname, searchParams]);

  return (
    <header className={styles.topbar}>
      <div className={styles.inner}>
        {/* -------- 左侧：品牌 Logo + 主导航 -------- */}
        <div className={styles.left}>
          {/* 品牌 Logo：点击回首页 */}
          <Link href="/" className={styles.brand}>
            <span className={styles.logoBox}>Q</span>
            <span className={styles.brandName}>小伦问卷</span>
          </Link>

          {/* 主导航链接 */}
          <nav className={styles.nav}>
            <Link href="/" className={styles.navLink}>
              首页
            </Link>
            <Link href="/templates" className={styles.navLink}>
              模板中心
            </Link>
          </nav>
        </div>

        {/* -------- 右侧：登录状态区域 -------- */}
        <div className={styles.right}>
          {session?.user ? (
            // ---- 已登录：显示头像/用户名 + 退出按钮 ----
            <div className={styles.userInfo}>
              {/* 头像占位圆圈（如有头像 URL 可换成 <Image>） */}
              <div className={styles.avatar}>
                {/* 取用户名首字符作为头像文字 */}
                {(session.user.name ?? session.user.email ?? "?")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <span className={styles.username}>
                {session.user.name ?? session.user.email}
              </span>
              {/*
               * 登出按钮是 Client Component（需要 onClick/signOut），
               * 嵌入在 Server Component 中完全没问题。
               */}
              <SignOutButton />
            </div>
          ) : (
            // ---- 未登录：显示"登录"按钮，跳转到 B 端统一登录页 ----
            // B 端登录成功后，将浏览器重定向到 C 端 SSO 回调端点：
            //   ${authBase}/api/auth/sso-callback?token=xx&username=xx&callbackUrl=xx
            // SSO 回调端点设置 Session Cookie 后再跳回 callbackUrl（当前 C 端页面）
            <a
              href={`${bAppOrigin}/login?callbackUrl=${encodeURIComponent(loginCallbackUrl)}&authBase=${encodeURIComponent(cAppOrigin)}`}
              className={styles.loginBtn}
            >
              登录
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
