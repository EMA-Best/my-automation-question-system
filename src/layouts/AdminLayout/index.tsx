import type { FC } from 'react';
import { Outlet } from 'react-router-dom';

// 已从路由中移除：保留为占位，避免旧引用导致的编译问题。
const AdminLayout: FC = () => {
  return <Outlet />;
};

export default AdminLayout;
