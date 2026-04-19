import type { Metadata } from "next";
import PageWrapper from "@/app/PageWrapper";
import Link from "next/link";

export const metadata: Metadata = {
  title: "提交成功",
  description: "问卷提交成功页面",
};

export default function Success() {
  return (
    <PageWrapper>
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="flex flex-col w-full max-w-md">
          <div className="mx-auto w-16 h-16 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 ring-4 ring-green-50 dark:ring-green-900/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#22c55e"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 text-center">
            提交成功
          </h1>

          <p className="text-gray-500 dark:text-gray-400 mb-8 text-center leading-relaxed">
            感谢您的配合！
            <br />
            您的回答已成功记录到系统中。
          </p>

          <Link
            href="/"
            className="block w-full text-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            返回首页
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}
