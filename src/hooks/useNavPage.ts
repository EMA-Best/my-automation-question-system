/**
 * @description 判断当前页面是否登录与未登录，根据登录状态返回不同的导航页面
 * @returns {string} 导航页面路径
 */

import { useLocation, useNavigate } from 'react-router-dom';
import useGetUserInfo from './useGetUserInfo';
import { useEffect } from 'react';
import { isLoginOrRegister, isNoNeedUserInfo } from '../router';
import { routePath } from '../router/index';

function useNavPage(waitingUserData: boolean) {
  const { username } = useGetUserInfo();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (waitingUserData) return;

    // 已经登录了
    if (username) {
      // 去的登录页或者注册页 就跳转到管理问卷列表页
      if (isLoginOrRegister(pathname)) {
        navigate(routePath.MANAGE_LIST);
      }
      return;
    }
    // 没有登录
    if (isNoNeedUserInfo(pathname)) {
      // 去的是不用用户信息的页面 那么直接放行 什么也不做
      return;
    } else {
      // 跳转到登录页
      navigate(routePath.LOGIN);
    }
  }, [username, pathname, waitingUserData]);
}

export default useNavPage;
