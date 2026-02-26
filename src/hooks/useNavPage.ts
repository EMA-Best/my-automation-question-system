/**
 * @description 判断当前页面是否登录与未登录，根据登录状态返回不同的导航页面
 * @returns {string} 导航页面路径
 */

import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import useGetUserInfo from './useGetUserInfo';
import { useEffect } from 'react';
import { isLoginOrRegister, isNoNeedUserInfo } from '../router';
import { routePath } from '../router/index';

/** callbackUrl 搜索参数名 */
const CALLBACK_URL_KEY = 'callbackUrl';

/**
 * 判断 URL 是否为外部链接（跨域地址）
 * 用于区分"站内跳转用 navigate"和"跨域回跳用 window.location"
 */
function isExternalUrl(url: string): boolean {
  if (!url.startsWith('http')) return false;
  try {
    const target = new URL(url);
    return target.origin !== window.location.origin;
  } catch {
    return false;
  }
}

function useNavPage(waitingUserData: boolean) {
  const { username, role } = useGetUserInfo();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (waitingUserData) return;

    // 已经登录了
    if (username) {
      // 角色权限：非管理员禁止访问管理后台
      if (
        (pathname.startsWith('/manage/reviews') ||
          pathname.startsWith('/manage/users') ||
          pathname.startsWith('/manage/templates')) &&
        role !== 'admin'
      ) {
        navigate(routePath.FORBIDDEN);
        return;
      }

      // 当前在登录页或注册页 → 需要跳走
      if (isLoginOrRegister(pathname)) {
        // 优先使用 callbackUrl（来自 C 端 SSO 回跳、或其他入口携带的回跳地址）
        const callbackUrl = searchParams.get(CALLBACK_URL_KEY);

        if (callbackUrl) {
          console.log('callbackUrl: ', callbackUrl);
          if (isExternalUrl(callbackUrl)) {
            // 外部地址（如 C 端），整页跳转
            window.location.href = callbackUrl;
          } else {
            // 站内路径，使用 react-router 导航
            navigate(callbackUrl, { replace: true });
          }
        } else {
          // 无 callbackUrl，默认跳到问卷列表
          navigate(routePath.MANAGE_LIST);
        }
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
  }, [username, role, pathname, waitingUserData, navigate, searchParams]);
}

export default useNavPage;
