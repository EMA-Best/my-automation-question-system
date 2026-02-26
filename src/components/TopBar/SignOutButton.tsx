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

import { signOut } from "next-auth/react";

interface SignOutButtonProps {
  /** 按钮文案，默认"退出登录" */
  label?: string;
}

export default function SignOutButton({
  label = "退出登录",
}: SignOutButtonProps) {
  return (
    <button
      onClick={() =>
        // 登出后重定向到首页；callbackUrl 也可以换成你想要的任意页面
        signOut({ callbackUrl: "/" })
      }
      className="px-4 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
    >
      {label}
    </button>
  );
}
