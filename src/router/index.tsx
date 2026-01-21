import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy } from 'react';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import QuestionLayout from '../layouts/QuestionLayout';
import ManageLayout from '../layouts/ManageLayout';
import Home from '../pages/Home';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import Register from '../pages/Register';
import Forbidden from '../pages/Forbidden';
// import Edit from '../pages/question/Edit';
// import Stat from '../pages/question/Stat';
import List from '../pages/manage/List';
import Trash from '../pages/manage/Trash';
import Star from '../pages/manage/Star';
import AdminReviews from '../pages/manage/AdminReviews';
import AdminUsers from '../pages/manage/AdminUsers';

// 常用路由路径（注意：router 创建时会用到，必须定义在前）
export const routePath = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  MANAGE_LIST: '/manage/list',
  MANAGE_STAR: '/manage/star',
  MANAGE_TRASH: '/manage/trash',
  MANAGE_REVIEWS: '/manage/reviews',
  MANAGE_USERS: '/manage/users',
  FORBIDDEN: '/403',
};

// 路由懒加载 拆分bundle 优化首页体积
const Edit = lazy(
  () => import(/* webpackChunkName:"editPage"*/ '../pages/question/Edit')
);
const Stat = lazy(
  () => import(/* webpackChunkName:"statPage"*/ '../pages/question/Stat')
);

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      {
        path: routePath.LOGIN,
        element: <Login />,
      },
      {
        path: routePath.REGISTER,
        element: <Register />,
      },
    ],
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '403',
        element: <Forbidden />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
      {
        path: 'manage',
        element: <ManageLayout />,
        children: [
          {
            path: 'list',
            element: <List />,
          },
          {
            path: 'trash',
            element: <Trash />,
          },
          {
            path: 'star',
            element: <Star />,
          },
          {
            path: 'reviews',
            element: <AdminReviews />,
          },
          {
            path: 'users',
            element: <AdminUsers />,
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
        ],
      },
    ],
  },
  {
    path: 'question',
    element: <QuestionLayout />,
    children: [
      {
        path: 'edit/:id',
        element: <Edit />,
      },
      {
        path: 'stat/:id',
        element: <Stat />,
      },
    ],
  },
]);

// 判断是否是登录页还是注册页
export const isLoginOrRegister = (pathname: string) => {
  return pathname === routePath.LOGIN || pathname === routePath.REGISTER;
};

// 不需要用户信息的页面
export const isNoNeedUserInfo = (pathname: string) => {
  return (
    pathname === routePath.HOME ||
    pathname === routePath.LOGIN ||
    pathname === routePath.REGISTER
  );
};

export default router;
