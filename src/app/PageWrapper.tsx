import Script from "next/script";
import { FC } from "react";

type PropsType = {
  css?: string;
  js?: string;
  children: React.ReactNode;
};

const PageWrapper: FC<PropsType> = (props) => {

  const { css = "", js = "", children } = props;

  return (
    <>
      {/* 不再设置 title 和 meta —— 交给页面 metadata */}
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {children}
        </div>
      </main>

      {/* 动态 CSS：用 style 标签插入到 head（可选） */}
      {css && (
        <style
          dangerouslySetInnerHTML={{ __html: css }}
          id="dynamic-page-css"
        />
      )}

      {/* 动态 JS：用 next/script */}
      {js && <Script id="page-js">{js}</Script>}
    </>
  );
};

export default PageWrapper;
