import axios from 'axios';
import { message } from 'antd';
import { getToken, removeToken } from '../utils/user-token';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function shouldSkipAuthHeader(url: string): boolean {
  // 兼容你项目里可能存在的两套路径：/api/user/* 与 /api/auth/*
  return (
    url.includes('/api/user/login') ||
    url.includes('/api/user/register') ||
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/register')
  );
}

function getCurrentPathname(): string {
  if (typeof window === 'undefined') return '';
  return window.location?.pathname || '';
}

function isPublicPath(pathname: string): boolean {
  // 这些页面不需要用户信息，也不应因为残留过期 token 而弹错
  return pathname === '/' || pathname === '/login' || pathname === '/register';
}

function isUserInfoApi(url: string): boolean {
  return url.includes('/api/user/info');
}

function isLoginApi(url: string): boolean {
  return url.includes('/api/user/login') || url.includes('/api/auth/login');
}

const instance = axios.create({
  baseURL: 'http://localhost:3005/',
  // baseURL: 'http://localhost:3001/',
  timeout: 10 * 1000,
});

instance.interceptors.request.use(
  (config) => {
    // 从localStorage中获取token
    const token = getToken();
    const url = config.url || '';

    // 登录/注册请求不自动携带 Authorization，避免残留 token 导致后端直接 401
    if (shouldSkipAuthHeader(url)) {
      return config;
    }

    if (token) {
      // 如果token存在，将其添加到请求头中
      // 每次请求都带上token
      config.headers.Authorization = `Bearer ${token}`; // JWT的token格式
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 统一拦截errno和msg
instance.interceptors.response.use(
  (res) => {
    const resData = (res.data || {}) as ResType;
    const { errno, data, msg } = resData;

    // 错误提示处理
    if (errno !== 0) {
      if (msg) {
        message.error(msg);
      }
      throw new Error(msg);
    }

    // 这里保持“直接返回 data”这一既有行为，便于业务层直接拿到 data
    // 使用 never 避免 any，同时满足 axios 拦截器返回类型约束
    return data as unknown as never;
  },
  (error: unknown) => {
    let errMsg = '请求失败';
    let statusCode: number | undefined;
    let requestUrl = '';

    if (axios.isAxiosError(error)) {
      statusCode = error.response?.status;
      requestUrl = error.config?.url || '';
      const responseData = error.response?.data;
      if (isRecord(responseData)) {
        const msg = responseData.msg;
        const messageField = responseData.message;

        if (typeof msg === 'string' && msg) {
          errMsg = msg;
        } else if (typeof messageField === 'string' && messageField) {
          errMsg = messageField;
        } else if (
          Array.isArray(messageField) &&
          messageField.length > 0 &&
          typeof messageField[0] === 'string'
        ) {
          errMsg = messageField[0];
        }
      }

      if (errMsg === '请求失败' && typeof error.message === 'string') {
        errMsg = error.message;
      }
    } else if (error instanceof Error && error.message) {
      errMsg = error.message;
    }

    // token 过期/无效：清理本地 token，避免后续一直 401
    if (statusCode === 401) {
      removeToken();
      const pathname = getCurrentPathname();
      // 公开页面：仅对“自动拉取用户信息”的 401 做静默处理
      if (isPublicPath(pathname) && isUserInfoApi(requestUrl)) {
        return Promise.reject(new Error(errMsg));
      }
    }

    // 登录接口的错误提示由登录页自行展示，避免全局 toast 与页面 toast 重复
    if (isLoginApi(requestUrl)) {
      return Promise.reject(new Error(errMsg));
    }

    message.error(errMsg);
    return Promise.reject(new Error(errMsg));
  }
);

export default instance;

// 定义响应数据的类型
export type ResType = {
  errno: number;
  data?: ResDataType;
  msg?: string;
};

// 定义响应数据中的data字段的类型
export type ResDataType = {
  [key: string]: unknown;
};
