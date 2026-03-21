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
import { routePath } from '../router';

// UserLoad 调试日志序号（用于串联刷新恢复链路）
const USERLOAD_TRACE_SEQ_KEY = '__b_userload_trace_seq__';

function logUserLoadDebug(message: string, extra?: unknown) {
  const isDevHost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');
  if (!isDevHost) return;

  // 每条日志带时间戳 + 流程编号，便于和 SSO 探测日志对照
  const ts = new Date().toISOString();
  let seq = 0;
  try {
    const current = Number(
      sessionStorage.getItem(USERLOAD_TRACE_SEQ_KEY) || '0'
    );
    seq = current + 1;
    sessionStorage.setItem(USERLOAD_TRACE_SEQ_KEY, String(seq));
  } catch {
    seq = 0;
  }

  const flowTag = seq > 0 ? `B-LOAD-${seq}` : 'B-LOAD-NA';

  if (typeof extra === 'undefined') {
    console.log(`[UserLoad][${ts}][${flowTag}] ${message}`);
    return;
  }
  console.log(`[UserLoad][${ts}][${flowTag}] ${message}`, extra);
}

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
    // 首页/登录/注册页通常不强制依赖用户信息。
    // 但首页需要“刷新后仍恢复登录态”：若本地已有 token，则静默拉取一次用户信息。
    if (isNoNeedUserInfo(pathname)) {
      if (pathname === routePath.HOME) {
        // Redux 在刷新后会重置；这里通过本地 token 回填用户态
        if (username) {
          logUserLoadDebug('首页已有用户态，无需恢复', { username });
          setWaitingUserData(false);
          return;
        }

        const token = getToken();
        if (token) {
          // 首页刷新命中本地 token：静默恢复用户态
          logUserLoadDebug('首页命中本地 token，开始恢复用户态');
          run();
          return;
        }

        logUserLoadDebug('首页无本地 token，保持未登录展示');
      }

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
      logUserLoadDebug('受保护页命中本地 token，拉取用户信息');
      run();
      return;
    }

    // 未登录：无需请求 /api/user/info
    setWaitingUserData(false);
  }, [pathname, username, run]);

  return { waitingUserData, loadUserInfo: run };
}

export default useLoadUserData;
