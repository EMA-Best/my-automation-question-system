import { createBrowserRouter } from 'react-router-dom';
import { lazy } from 'react';
import MainLayout from '../layouts/MainLayout';
import QuestionLayout from '../layouts/QuestionLayout';
import ManageLayout from '../layouts/ManageLayout';
import Home from '../pages/Home';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import Register from '../pages/Register';
// import Edit from '../pages/question/Edit';
// import Stat from '../pages/question/Stat';
import List from '../pages/manage/List';
import Trash from '../pages/manage/Trash';
import Star from '../pages/manage/Star';

// 路由懒加载 拆分bundle 优化首页体积
const Edit = lazy(
  () => import(/* webpackChunkName:"editPage"*/ '../pages/question/Edit')
);
const Stat = lazy(
  () => import(/* webpackChunkName:"statPage"*/ '../pages/question/Stat')
);

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
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

// 常用路由路径
export const routePath = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  MANAGE_LIST: '/manage/list',
};

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
