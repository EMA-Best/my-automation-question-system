import { Metadata } from "next";
import Link from "next/link";
import { getFeaturedQuestions } from "@/services/question";

export const metadata: Metadata = {
  title: "问卷系统 - 首页",
  description: "欢迎使用我们的问卷填写系统",
};

interface FeaturedQuestion {
  id: string;
  title: string;
  description: string;
  featured?: boolean;
  pinned?: boolean;
  questionCount: number;
  answerCount: number;
  publishedAt: string;
}

async function QuestionList() {
  let questions: FeaturedQuestion[] = [];
  let hasError = false;

  try {
    const res = await getFeaturedQuestions();
    questions = res.data || [];
  } catch (error) {
    console.error("获取热门问卷失败:", error);
    hasError = true;
  }

  if (hasError) {
    return (
      <div className="text-center py-8 text-red-500">
        获取问卷列表失败，请刷新重试
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="text-center py-8 text-gray-500">暂无热门问卷</div>;
  }

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
                {question.pinned && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    🔝 置顶
                  </span>
                )}
                {question.featured && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    ⭐ 推荐
                  </span>
                )}
              </div>
              <p className="text-gray-600 mb-3">{question.description}</p>
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

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 py-12 px-4">
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
          <div className="bg-linear-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              分享问卷
            </h3>
            <p className="text-gray-600">生成唯一链接，轻松分享给受访者</p>
          </div>
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
            <button className="px-8 py-3 bg-linear-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75">
              创建问卷
            </button>
            <button className="px-8 py-3 bg-white text-gray-800 font-medium rounded-lg shadow-md border border-gray-300 hover:shadow-lg transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75">
              浏览模板
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
