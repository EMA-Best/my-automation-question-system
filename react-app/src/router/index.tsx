/**
 * 路由配置文件
 * 定义应用的所有路由路径和组件映射
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import QuestionLayout from '../layouts/QuestionLayout';
import ManageLayout from '../layouts/ManageLayout';
import Home from '../pages/Home';
import Login from '../pages/Login';
import SsoBridge from '../pages/SsoBridge';
import SsoLogout from '../pages/SsoLogout';
import NotFound from '../pages/NotFound';
import Register from '../pages/Register';
import Forbidden from '../pages/Forbidden';
import List from '../pages/manage/List';
import Trash from '../pages/manage/Trash';
import Star from '../pages/manage/Star';
import AdminReviews from '../pages/manage/AdminReviews';
import AdminUsers from '../pages/manage/AdminUsers';
import AdminTemplates from '../pages/manage/AdminTemplates';

/**
 * 路由路径常量
 * 集中管理所有路由路径，方便在代码中引用
 */
export const routePath = {
  HOME: '/',                    // 首页
  LOGIN: '/login',              // 登录页
  REGISTER: '/register',        // 注册页
  MANAGE_LIST: '/manage/list',  // 问卷管理列表
  MANAGE_STAR: '/manage/star',  // 收藏的问卷
  MANAGE_TRASH: '/manage/trash', // 回收站
  MANAGE_REVIEWS: '/manage/reviews', // 审核管理
  MANAGE_USERS: '/manage/users', // 用户管理
  MANAGE_TEMPLATES: '/manage/templates', // 模板管理
  FORBIDDEN: '/403',            // 403禁止访问
};

/**
 * 路由懒加载配置
 * 拆分bundle，优化首页加载速度
 */
// 问卷编辑页面
const Edit = lazy(
  () => import(/* webpackChunkName:"editPage"*/ '../pages/question/Edit')
);
// 问卷统计页面
const Stat = lazy(
  () => import(/* webpackChunkName:"statPage"*/ '../pages/question/Stat')
);

/**
 * 应用路由配置
 * 使用 createBrowserRouter 创建路由树
 */
const router = createBrowserRouter([
  {
    // 认证相关布局（登录、注册、SSO）
    element: <AuthLayout />,
    children: [
      {
        path: routePath.LOGIN,
        element: <Login />, // 登录页面
      },
      {
        path: routePath.REGISTER,
        element: <Register />, // 注册页面
      },
      {
        path: '/sso-bridge',
        element: <SsoBridge />, // SSO登录桥接页面
      },
      {
        path: '/sso-logout',
        element: <SsoLogout />, // SSO登出页面
      },
    ],
  },
  {
    // 主应用布局
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <Home />, // 首页
      },
      {
        path: '403',
        element: <Forbidden />, // 403禁止访问页面
      },
      {
        path: '*',
        element: <NotFound />, // 404页面
      },
      {
        // 管理后台布局
        path: 'manage',
        element: <ManageLayout />,
        children: [
          {
            index: true,
            element: <Navigate to={routePath.MANAGE_LIST} replace={true} />, // 默认跳转到问卷列表
          },
          {
            path: 'list',
            element: <List />, // 问卷列表页面
          },
          {
            path: 'trash',
            element: <Trash />, // 回收站页面
          },
          {
            path: 'star',
            element: <Star />, // 收藏的问卷页面
          },
          {
            path: 'reviews',
            element: <AdminReviews />, // 审核管理页面
          },
          {
            path: 'users',
            element: <AdminUsers />, // 用户管理页面
          },
          {
            path: 'templates',
            element: <AdminTemplates />, // 模板管理页面
          },

          // 兼容旧的管理后台路由（已取消中间菜单结构）
          {
            path: 'admin',
            children: [
              {
                path: '',
                element: <Navigate to={routePath.MANAGE_LIST} replace={true} />,
              },
              {
                path: 'questions',
                element: <Navigate to={routePath.MANAGE_LIST} replace={true} />,
              },
              {
                path: 'reviews',
                element: (
                  <Navigate to={routePath.MANAGE_REVIEWS} replace={true} />
                ),
              },
              {
                path: 'users',
                element: (
                  <Navigate to={routePath.MANAGE_USERS} replace={true} />
                ),
              },
              {
                path: '*',
                element: <Navigate to={routePath.MANAGE_LIST} replace={true} />,
              },
            ],
          },
          {
            path: '*',
            element: <Navigate to={routePath.MANAGE_LIST} replace={true} />, // 管理后台未匹配路径跳转到列表
          },
        ],
      },
    ],
  },
  {
    // 问卷相关布局
    path: 'question',
    element: <QuestionLayout />,
    children: [
      {
        path: 'edit/:id',
        element: <Edit />, // 问卷编辑页面（带ID参数）
      },
      {
        path: 'stat/:id',
        element: <Stat />, // 问卷统计页面（带ID参数）
      },
    ],
  },
]);

/**
 * 判断是否是登录页或注册页
 * @param pathname 当前路径
 * @returns boolean 是否是登录或注册页
 */
export const isLoginOrRegister = (pathname: string) => {
  return pathname === routePath.LOGIN || pathname === routePath.REGISTER;
};

/**
 * 判断是否不需要用户信息的页面
 * @param pathname 当前路径
 * @returns boolean 是否不需要用户信息
 */
export const isNoNeedUserInfo = (pathname: string) => {
  return (
    pathname === routePath.HOME ||
    pathname === routePath.LOGIN ||
    pathname === routePath.REGISTER ||
    pathname === '/sso-bridge' ||
    pathname === '/sso-logout'
  );
};

/**
 * 应用路由实例
 */
export default router;
