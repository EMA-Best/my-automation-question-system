/**
 * @description B 端 SSO 单点登录工具函数
 *
 * 设计思路（基于 TEMPLATE_SYSTEM_SSO_IMPLEMENTATION.md §5.4）：
 * - 登录入口统一由 C 端 Next.js BFF（next-auth）提供
 * - B 端触发登录时，重定向到 C 端 /api/auth/signin?callbackUrl=<returnTo>
 * - 登录成功后 next-auth 自动回跳到 callbackUrl（即 B 端页面）
 *
 * 跨域 Cookie 策略：
 * - 同一父域（推荐）：session cookie 设置 domain='.example.com' 即可共享
 * - 不同域：B 端需主动调用 C 端 /api/auth/session（配 CORS）获取登录态
 */

// ============================================================
// 环境配置
// ============================================================

/**
 * C 端 Next.js 应用的域名（包含协议，不带尾部 /）
 * 生产环境应替换为真实域名，例如 'https://www.example.com'
 *
 * 读取优先级：
 *   1. 环境变量 REACT_APP_C_APP_ORIGIN
 *   2. 默认值 '' (开发阶段可先留空，待部署时配置)
 */
// eslint-disable-next-line no-undef
const C_APP_ORIGIN: string = process.env.REACT_APP_C_APP_ORIGIN ?? '';

/**
 * B 端自身的域名（用于拼接回跳地址）
 * 通常无需手动配置，直接取 window.location.origin
 */
function getBAppOrigin(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

// ============================================================
// 核心 API
// ============================================================

/**
 * 重定向到 C 端 BFF 登录入口（next-auth 的 /api/auth/signin）
 *
 * 使用场景：
 *   1. B 端接口返回 401 → 未登录，需跳转登录
 *   2. 用户主动点击"登录"按钮
 *
 * 流程说明：
 *   B端 → C端 /api/auth/signin → OIDC Provider 登录页
 *   → 登录成功 → C端 next-auth 回调（code→token 交换在服务端完成）
 *   → 回跳到 callbackUrl（B端页面）→ B端恢复原页面
 *
 * @param returnTo - 登录成功后要回跳的 B 端路径（默认为当前页面的完整 URL）
 *
 * @example
 * ```ts
 * // 检测到 401，跳转登录（登录成功后回到当前页）
 * redirectToSSOLogin();
 *
 * // 指定回跳到问卷列表页
 * redirectToSSOLogin('/manage/list');
 * ```
 */
export function redirectToSSOLogin(returnTo?: string): void {
  if (!C_APP_ORIGIN) {
    console.warn(
      '[SSO] C_APP_ORIGIN 未配置，请设置环境变量 REACT_APP_C_APP_ORIGIN'
    );
    return;
  }

  // 若传入的是相对路径，则拼上 B 端 origin
  const absoluteReturnTo = returnTo
    ? returnTo.startsWith('http')
      ? returnTo
      : `${getBAppOrigin()}${returnTo}`
    : window.location.href; // 默认回到当前页

  // 拼接 next-auth 登录入口 URL
  const loginUrl = `${C_APP_ORIGIN}/api/auth/signin?callbackUrl=${encodeURIComponent(
    absoluteReturnTo
  )}`;

  // 整页跳转到 C 端 BFF 登录入口
  window.location.href = loginUrl;
}

// ============================================================
// 跨域 Session 查询（适用于 B/C 端不同域部署场景）
// ============================================================

/**
 * next-auth /api/auth/session 返回的用户信息结构
 * 注意：只包含脱敏信息，不含 access_token
 */
export interface SSOSessionUser {
  /** 用户唯一标识 */
  id: string;
  /** 用户名 */
  name?: string;
  /** 邮箱 */
  email?: string;
  /** 头像 URL */
  image?: string;
}

/** /api/auth/session 响应体 */
export interface SSOSessionResponse {
  /** 用户信息（未登录时为 undefined 或空对象） */
  user?: SSOSessionUser;
  /** session 过期时间（ISO 字符串） */
  expires?: string;
}

/**
 * 从 C 端 BFF 查询当前 SSO 登录态
 *
 * 适用场景：
 *   B 端与 C 端不在同一父域，无法共享 session cookie，
 *   需要主动调用 C 端 /api/auth/session 来检查用户是否已登录。
 *
 * 前提条件：
 *   C 端 Next.js 需要配置 CORS 白名单，允许 B 端域名携带 Cookie 请求。
 *   例如在 next.config.js 中设置 headers，或使用 middleware 添加：
 *     Access-Control-Allow-Origin: <B端域名>
 *     Access-Control-Allow-Credentials: true
 *
 * @returns 解析后的 session 数据；未登录时返回 null
 *
 * @example
 * ```ts
 * const session = await getSessionFromBFF();
 * if (session?.user) {
 *   console.log('当前 SSO 用户：', session.user.name);
 * } else {
 *   // 未登录，触发重定向
 *   redirectToSSOLogin();
 * }
 * ```
 */
export async function getSessionFromBFF(): Promise<SSOSessionResponse | null> {
  if (!C_APP_ORIGIN) {
    console.warn(
      '[SSO] C_APP_ORIGIN 未配置，请设置环境变量 REACT_APP_C_APP_ORIGIN'
    );
    return null;
  }

  try {
    const res = await fetch(`${C_APP_ORIGIN}/api/auth/session`, {
      method: 'GET',
      // credentials: 'include' 是关键，用于携带跨域 Cookie
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      console.warn('[SSO] 查询 session 失败，状态码：', res.status);
      return null;
    }

    const data: SSOSessionResponse = await res.json();

    // next-auth 未登录时返回空对象 {}，需判断 user 是否存在
    if (!data.user || !data.user.id) {
      return null;
    }

    return data;
  } catch (error) {
    console.error('[SSO] 查询 session 异常：', error);
    return null;
  }
}

// ============================================================
// SSO 登出
// ============================================================

/**
 * 触发 C 端 BFF 的 SSO 登出
 *
 * 调用 next-auth 的 /api/auth/signout 接口清除 session cookie，
 * 登出完成后重定向到指定页面。
 *
 * @param redirectTo - 登出后要跳转的地址（默认回到 B 端首页）
 *
 * @example
 * ```ts
 * // 登出后回到 B 端首页
 * ssoLogout();
 *
 * // 登出后回到 C 端首页
 * ssoLogout('https://www.example.com');
 * ```
 */
export function ssoLogout(redirectTo?: string): void {
  if (!C_APP_ORIGIN) {
    console.warn(
      '[SSO] C_APP_ORIGIN 未配置，请设置环境变量 REACT_APP_C_APP_ORIGIN'
    );
    return;
  }

  const callbackUrl = redirectTo ?? getBAppOrigin();

  // next-auth 登出入口
  const logoutUrl = `${C_APP_ORIGIN}/api/auth/signout?callbackUrl=${encodeURIComponent(
    callbackUrl
  )}`;

  window.location.href = logoutUrl;
}

// ============================================================
// 辅助：判断是否已配置 SSO
// ============================================================

/**
 * 检查 SSO 是否已正确配置
 * 可在应用初始化时调用，根据返回值决定是否启用 SSO 相关功能
 *
 * @returns true 表示已配置 C_APP_ORIGIN，SSO 功能可用
 */
export function isSSOConfigured(): boolean {
  return C_APP_ORIGIN.length > 0;
}
