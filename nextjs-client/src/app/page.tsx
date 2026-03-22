/**
 * 问卷系统首页
 * 展示热门问卷、功能介绍和行动号召
 */
import { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { getFeaturedQuestions } from "@/services/question";
import TopBar from "@/components/TopBar";
import CreateQuestionButton from "./_components/CreateQuestionButton";

/**
 * 页面元数据
 */
export const metadata: Metadata = {
  title: "问卷系统 - 首页",
  description: "欢迎使用我们的问卷填写系统",
};

/**
 * 热门问卷类型
 */
interface FeaturedQuestion {
  id: string;              // 问卷ID
  title: string;           // 问卷标题
  description: string;     // 问卷描述
  featured?: boolean;      // 是否推荐
  pinned?: boolean;        // 是否置顶
  questionCount: number;   // 问题数量
  answerCount: number;     // 回答数量
  publishedAt: string;     // 发布时间
}

/**
 * 问卷列表组件
 * 异步获取并展示热门问卷
 */
async function QuestionList() {
  let questions: FeaturedQuestion[] = [];
  let hasError = false;

  try {
    // 调用API获取热门问卷
    const res = await getFeaturedQuestions();
    questions = res.data || [];
  } catch (error) {
    console.error("获取热门问卷失败:", error);
    hasError = true;
  }

  // 错误状态处理
  if (hasError) {
    return (
      <div className="text-center py-8 text-red-500">
        获取问卷列表失败，请刷新重试
      </div>
    );
  }

  // 空状态处理
  if (questions.length === 0) {
    return <div className="text-center py-8 text-gray-500">暂无热门问卷</div>;
  }

  // 渲染问卷列表
  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <Link
          key={question.id}
          href={`/question/${question.id}/preview`}
          className="block p-6 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-300"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-semibold text-gray-800">
                  {question.title}
                </h3>
                {/* 置顶标签 */}
                {question.pinned && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    🔝 置顶
                  </span>
                )}
                {/* 推荐标签 */}
                {question.featured && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    ⭐ 推荐
                  </span>
                )}
              </div>
              {/* 问卷描述 */}
              <p className="text-gray-600 mb-3">{question.description}</p>
              {/* 问卷统计信息 */}
              <div className="flex items-center text-sm text-gray-500">
                <span className="mr-4">
                  📋 共{question.questionCount}个问题
                </span>
                <span>👥 已有{question.answerCount}人填写</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/**
 * 首页主组件
 * @returns 首页界面
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50">
      {/* 顶部导航栏 */}
      <Suspense fallback={<div className="h-16 bg-gray-50 border-b border-gray-200" />}>
        <TopBar />
      </Suspense>
      
      {/* 主体内容区：上下内边距 + 水平居中 */}
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          {/* 标题区域 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              欢迎使用小伦问卷
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              我们提供专业的问卷创建、填写和分析服务，帮助您轻松收集和管理数据
            </p>
          </div>

          {/* 功能介绍 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* 创建问卷 */}
            <div className="bg-linear-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                创建问卷
              </h3>
              <p className="text-gray-600">
                简单易用的问卷编辑器，支持多种题型和自定义样式
              </p>
            </div>
            
            {/* 分享问卷 */}
            <div className="bg-linear-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                分享问卷
              </h3>
              <p className="text-gray-600">生成唯一链接，轻松分享给受访者</p>
            </div>
            
            {/* 分析数据 */}
            <div className="bg-linear-to-br from-pink-50 to-pink-100 p-6 rounded-xl border border-pink-200">
              <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                分析数据
              </h3>
              <p className="text-gray-600">
                实时查看问卷结果，生成详细的数据报告
              </p>
            </div>
          </div>

          {/* 问卷示例 */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              热门问卷示例
            </h2>
            <QuestionList />
          </div>

          {/* 行动号召 */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              开始您的问卷之旅
            </h2>
            <p className="text-gray-600 mb-6">
              立即创建您的第一个问卷，或者浏览更多模板获取灵感
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/*
               * 创建问卷按钮（Client Component）
               * - 已登录：创建后直跳 B 端编辑页
               * - 未登录：先去 B 端登录，登录后回到 C 端中转页自动创建并跳编辑页
               */}
              <CreateQuestionButton />
              <Link
                href="/templates"
                className="px-8 py-3 bg-white text-gray-800 font-medium rounded-lg shadow-md border border-gray-300 hover:shadow-lg transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 text-center cursor-pointer"
              >
                浏览模板
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
