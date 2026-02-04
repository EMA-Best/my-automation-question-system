import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '问卷系统 - 首页',
  description: '欢迎使用我们的问卷填写系统',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">欢迎使用小伦问卷</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            我们提供专业的问卷创建、填写和分析服务，帮助您轻松收集和管理数据
          </p>
        </div>

        {/* 功能介绍 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">创建问卷</h3>
            <p className="text-gray-600">
              简单易用的问卷编辑器，支持多种题型和自定义样式
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">分享问卷</h3>
            <p className="text-gray-600">
              生成唯一链接，轻松分享给受访者
            </p>
          </div>
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-xl border border-pink-200">
            <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">分析数据</h3>
            <p className="text-gray-600">
              实时查看问卷结果，生成详细的数据报告
            </p>
          </div>
        </div>

        {/* 问卷示例 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">热门问卷示例</h2>
          <div className="space-y-4">
            <Link 
              href="/question/695cfb7519ba8436e87d9c28" 
              className="block p-6 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-300"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-2">年轻人动漫偏好调查</h3>
              <p className="text-gray-600 mb-3">了解年轻人对不同类型动漫的偏好和观看习惯</p>
              <div className="flex items-center text-sm text-gray-500">
                <span className="mr-4">📋 共10个问题</span>
                <span>👥 已有523人填写</span>
              </div>
            </Link>
            <div className="block p-6 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-300 cursor-not-allowed opacity-75">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">产品满意度调查</h3>
              <p className="text-gray-600 mb-3">收集用户对我们产品的使用体验和建议</p>
              <div className="flex items-center text-sm text-gray-500">
                <span className="mr-4">📋 共8个问题</span>
                <span>👥 已有312人填写</span>
              </div>
            </div>
            <div className="block p-6 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-300 cursor-not-allowed opacity-75">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">员工工作满意度调查</h3>
              <p className="text-gray-600 mb-3">了解员工的工作环境和满意度情况</p>
              <div className="flex items-center text-sm text-gray-500">
                <span className="mr-4">📋 共12个问题</span>
                <span>👥 已有89人填写</span>
              </div>
            </div>
          </div>
        </div>

        {/* 行动号召 */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">开始您的问卷之旅</h2>
          <p className="text-gray-600 mb-6">
            立即创建您的第一个问卷，或者浏览更多模板获取灵感
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
            >
              创建问卷
            </button>
            <button 
              className="px-8 py-3 bg-white text-gray-800 font-medium rounded-lg shadow-md border border-gray-300 hover:shadow-lg transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
            >
              浏览模板
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}