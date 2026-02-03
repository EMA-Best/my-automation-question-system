/**
 * @description 从后端加载用户信息存储到redux store
 */

import { useEffect, useState } from 'react';
import { useRequest } from 'ahooks';
import { getUserInfoService } from '../services/user';
import useGetUserInfo from './useGetUserInfo';
import { useDispatch } from 'react-redux';
import { loginReducer } from '../store/userReducer';
import { getToken } from '../utils/user-token';
import { useLocation } from 'react-router-dom';
import { isNoNeedUserInfo } from '../router';

function useLoadUserData() {
  // 定义是否在等待用户数据加载完成
  const [waitingUserData, setWaitingUserData] = useState(true);

  const { pathname } = useLocation();

  const dispatch = useDispatch();
  // ajax获取用户信息
  const { run } = useRequest(getUserInfoService, {
    manual: true,
    onSuccess(result) {
      const { username, nickname, role, mustChangePassword } = result;
      dispatch(
        loginReducer({
          username,
          nickname,
          role,
          mustChangePassword: Boolean(mustChangePassword),
        })
      ); // 存储用户信息到redux store
    },
    // 无论成功失败，都设置waitingUserData为false
    onFinally() {
      setWaitingUserData(false);
    },
  });

  // 从redux store中获取用户信息 判断是否存在username
  const { username } = useGetUserInfo();

  // 组件挂载时或username变化时，检查并加载用户信息
  useEffect(() => {
    // 首页/登录/注册页：不需要用户信息，直接放行（避免残留 token 过期导致首页弹错）
    if (isNoNeedUserInfo(pathname)) {
      setWaitingUserData(false);
      return;
    }

    // 如果已经有用户名，说明用户信息已经加载完成
    if (username) {
      setWaitingUserData(false);
      return;
    }

    // 仅在本地存在 token 时才拉取用户信息
    const token = getToken();
    if (token) {
      run();
      return;
    }

    // 未登录：无需请求 /api/user/info
    setWaitingUserData(false);
  }, [pathname, username, run]);

  return { waitingUserData, loadUserInfo: run };
}

export default useLoadUserData;
