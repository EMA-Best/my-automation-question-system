/**
 * @description 判断当前页面是否登录与未登录，根据登录状态返回不同的导航页面
 * @returns {string} 导航页面路径
 */

import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import useGetUserInfo from './useGetUserInfo';
import { useEffect } from 'react';
import { isLoginOrRegister, isNoNeedUserInfo } from '../router';
import { routePath } from '../router/index';
import { useDispatch } from 'react-redux';
import { loginReducer } from '../store/userReducer';
import { getUserInfoService } from '../services/user';
import { removeToken, setToken } from '../utils/user-token';

/** callbackUrl 搜索参数名 */
const CALLBACK_URL_KEY = 'callbackUrl';
const SSO_PROBE_LAST_TS_KEY = '__b_guard_sso_probe_last_ts__';
// 首页 iframe 探测进行中的时间戳（用于防重入）
const HOME_SSO_IFRAME_INFLIGHT_KEY = '__b_home_sso_iframe_inflight__';
// SSO 调试日志序号（用于串联同一浏览器会话下的排障过程）
const SSO_TRACE_SEQ_KEY = '__b_sso_trace_seq__';

/**
 * 轻量冷却窗口：每隔 N 分钟允许再次主动探测一次 C 端登录态
 *
 * 说明：
 * - 优先读取环境变量 REACT_APP_SSO_PROBE_COOLDOWN_MINUTES
 * - 值越小，自动探测越频繁（跳转也可能更频繁）
 * - 值越大，探测更克制（体验更稳）
 */
type RuntimeEnv = { process?: { env?: Record<string, string | undefined> } };

const ENV = (globalThis as RuntimeEnv).process?.env ?? {};
const SSO_PROBE_COOLDOWN_MINUTES_ENV = ENV.REACT_APP_SSO_PROBE_COOLDOWN_MINUTES;

const parsedCooldownMinutes = Number(SSO_PROBE_COOLDOWN_MINUTES_ENV);
const SSO_PROBE_COOLDOWN_MINUTES =
  Number.isFinite(parsedCooldownMinutes) && parsedCooldownMinutes > 0
    ? parsedCooldownMinutes
    : 10;

const SSO_PROBE_COOLDOWN_MS = SSO_PROBE_COOLDOWN_MINUTES * 60 * 1000;

const C_APP_ORIGIN = ENV.REACT_APP_C_APP_ORIGIN ?? 'http://localhost:3000';

/**
 * 轻量调试日志：仅在开发环境输出，用于排查 SSO 探测行为。
 * 生产环境静默，避免污染控制台。
 */
function logSsoDebug(message: string, extra?: unknown) {
  const isDevHost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1');
  const isDevEnv = ENV.NODE_ENV === 'development';
  const isDev = isDevHost || isDevEnv;
  if (!isDev) return;

  // 为每条日志打上时间戳 + 流程编号，便于排查“刷新后到底走了哪条分支”
  const ts = new Date().toISOString();
  let seq = 0;
  try {
    const current = Number(sessionStorage.getItem(SSO_TRACE_SEQ_KEY) || '0');
    seq = current + 1;
    sessionStorage.setItem(SSO_TRACE_SEQ_KEY, String(seq));
  } catch {
    seq = 0;
  }

  const flowTag = seq > 0 ? `B-SSO-${seq}` : 'B-SSO-NA';

  if (typeof extra === 'undefined') {
    console.log(`[SSO][B][${ts}][${flowTag}] ${message}`);
    return;
  }
  console.log(`[SSO][B][${ts}][${flowTag}] ${message}`, extra);
}

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

/**
 * 判断当前是否允许再次发起主动探测
 * - 从 sessionStorage 读取上次探测时间戳
 * - 超过冷却窗口才允许再次探测
 */
function canRunSsoProbeNow(): boolean {
  const lastTsRaw = sessionStorage.getItem(SSO_PROBE_LAST_TS_KEY);
  const lastTs = Number(lastTsRaw || '0');
  if (!lastTs) return true;
  return Date.now() - lastTs >= SSO_PROBE_COOLDOWN_MS;
}

function useNavPage(waitingUserData: boolean) {
  const { username, role } = useGetUserInfo();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();

  useEffect(() => {
    if (waitingUserData) return;

    // 已经登录了
    if (username) {
      // 你提到“刷新后已登录时控制台没日志”，这里补一条可见日志便于排查。
      logSsoDebug('当前已登录，跳过首页/受保护页探测', { pathname, username });

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
        logSsoDebug('已登录但位于登录/注册页，准备跳转', { pathname });
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
      // 兼容旧链路：若首页 URL 上已有桥接 token，直接在当前页静默消费。
      if (pathname === routePath.HOME) {
        const tokenFromQuery =
          searchParams.get('token') ??
          searchParams.get('access_token') ??
          searchParams.get('accessToken');
        const usernameFromQuery =
          searchParams.get('username') ??
          searchParams.get('userName') ??
          searchParams.get('name');

        if (tokenFromQuery) {
          logSsoDebug('首页收到桥接 token，开始静默消费', { pathname });

          // 1) 先写入本地 token（供后续 API 鉴权使用）
          setToken(tokenFromQuery);

          // 2) 立刻清理 URL 临时参数，避免刷新后重复消费
          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete('token');
          cleanUrl.searchParams.delete('access_token');
          cleanUrl.searchParams.delete('accessToken');
          cleanUrl.searchParams.delete('username');
          cleanUrl.searchParams.delete('userName');
          cleanUrl.searchParams.delete('name');
          cleanUrl.searchParams.delete('ssoBridge');
          window.history.replaceState({}, '', cleanUrl.toString());

          // 3) 静默拉取用户信息并写入 Redux，避免跳转到登录页造成闪烁
          const consumeTokenOnHome = async () => {
            try {
              const userInfo = await getUserInfoService();
              dispatch(
                loginReducer({
                  username: userInfo.username,
                  nickname: userInfo.nickname,
                  role: userInfo.role,
                  mustChangePassword: Boolean(userInfo.mustChangePassword),
                })
              );
              logSsoDebug('首页静默消费 token 成功', {
                user: userInfo.username,
                fromBridgeUser: usernameFromQuery || undefined,
              });
            } catch (error) {
              // token 无效时回滚，保持未登录态并打印调试日志
              removeToken();
              logSsoDebug('首页静默消费 token 失败，已回滚', error);
            }
          };

          void consumeTokenOnHome();
          return;
        }
      }

      // 首页（B 端）刷新探测改为 iframe 静默桥接：
      // - 不发生整页跳转，避免“闪回登录页/闪屏”
      // - C 有会话时通过 postMessage 回传 token，由首页静默消费
      // - C 无会话时返回 miss，首页保持未登录展示
      if (pathname === routePath.HOME && C_APP_ORIGIN && canRunSsoProbeNow()) {
        const inflightAt = Number(
          sessionStorage.getItem(HOME_SSO_IFRAME_INFLIGHT_KEY) || '0'
        );
        // 防止 StrictMode 或短时重复 effect 导致并发创建多个 iframe
        if (inflightAt && Date.now() - inflightAt < 8000) {
          logSsoDebug('首页静默探测跳过：已有探测进行中');
          return;
        }

        sessionStorage.setItem(SSO_PROBE_LAST_TS_KEY, String(Date.now()));
        sessionStorage.setItem(
          HOME_SSO_IFRAME_INFLIGHT_KEY,
          String(Date.now())
        );
        logSsoDebug('首页触发 iframe 静默探测', { pathname });

        const expectedOrigin = window.location.origin;

        // 回调到 B 的 /sso-bridge 页面，由该页面将结果 postMessage 给首页
        const callbackUrl = new URL('/sso-bridge', expectedOrigin);
        callbackUrl.searchParams.set('origin', expectedOrigin);
        callbackUrl.searchParams.set('source', 'b-home-probe');

        const bridgeUrl = new URL('/api/auth/sso-bridge', C_APP_ORIGIN);
        bridgeUrl.searchParams.set('callbackUrl', callbackUrl.toString());

        let done = false;
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.setAttribute('aria-hidden', 'true');

        const cleanup = () => {
          if (done) return;
          done = true;
          window.removeEventListener('message', onMessage);
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
          sessionStorage.removeItem(HOME_SSO_IFRAME_INFLIGHT_KEY);
        };

        const consumeBridgeToken = async (token: string) => {
          setToken(token);
          try {
            const userInfo = await getUserInfoService();
            dispatch(
              loginReducer({
                username: userInfo.username,
                nickname: userInfo.nickname,
                role: userInfo.role,
                mustChangePassword: Boolean(userInfo.mustChangePassword),
              })
            );
            logSsoDebug('首页 iframe 探测命中并静默登录成功', {
              user: userInfo.username,
            });
          } catch (error) {
            removeToken();
            logSsoDebug('首页 iframe 探测命中但 token 消费失败，已回滚', error);
          }
        };

        const onMessage = (event: MessageEvent) => {
          // 仅信任同源回调页发来的消息
          if (event.origin !== expectedOrigin) return;

          const payload = event.data as
            | {
                type?: string;
                status?: 'ok' | 'miss';
                token?: string;
                username?: string;
              }
            | undefined;

          if (payload?.type !== 'B_SSO_BRIDGE_RESULT') return;

          if (payload.status === 'ok' && payload.token) {
            void consumeBridgeToken(payload.token);
          } else {
            logSsoDebug('首页 iframe 探测 miss（C 端未登录）');
          }

          cleanup();
        };

        window.addEventListener('message', onMessage);
        iframe.src = bridgeUrl.toString();
        document.body.appendChild(iframe);

        // 兜底超时：防止消息未返回时残留监听和 iframe
        window.setTimeout(() => {
          if (!done) {
            logSsoDebug('首页 iframe 探测超时，自动清理');
            cleanup();
          }
        }, 8000);

        return;
      }

      // 去的是不用用户信息的页面，默认放行
      return;
    } else {
      // 非登录页访问时：按冷却窗口主动探测 C 端登录态。
      // 命中时 C 会把 token 回传给 B 登录页消费；未命中则回到 B 登录页继续常规登录。
      if (C_APP_ORIGIN && canRunSsoProbeNow()) {
        // 记录本次探测时间，避免短时间内重复跨端跳转
        sessionStorage.setItem(SSO_PROBE_LAST_TS_KEY, String(Date.now()));
        logSsoDebug('受保护页触发桥接探测', { pathname });

        // 当前受保护页地址作为最终回跳地址
        const returnToCurrent = window.location.href;

        // 先回到 B 登录页消费桥接参数，再由登录页恢复到原受保护页
        const loginUrl = new URL(`${window.location.origin}${routePath.LOGIN}`);
        loginUrl.searchParams.set(CALLBACK_URL_KEY, returnToCurrent);

        // 触发 C 端桥接入口
        const bridgeUrl = new URL('/api/auth/sso-bridge', C_APP_ORIGIN);
        bridgeUrl.searchParams.set('callbackUrl', loginUrl.toString());

        window.location.href = bridgeUrl.toString();
        return;
      }

      if (pathname === routePath.HOME && C_APP_ORIGIN) {
        logSsoDebug('首页探测跳过：处于冷却窗口');
      }

      // 跳转到登录页
      navigate(routePath.LOGIN);
    }
  }, [
    username,
    role,
    pathname,
    waitingUserData,
    navigate,
    searchParams,
    dispatch,
  ]);
}

export default useNavPage;
