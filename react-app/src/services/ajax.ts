/**
 * AJAX 网络请求配置
 * 基于 axios 的封装，包含请求/响应拦截器、错误处理等
 */
import axios from 'axios';
import { message } from 'antd';
import { getToken, removeToken } from '../utils/user-token';

/**
 * 类型守卫：判断值是否为对象
 * @param value 要判断的值
 * @returns boolean 是否为对象
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * 判断是否需要跳过认证头
 * 登录/注册请求不自动携带 Authorization，避免残留 token 导致后端直接 401
 * @param url 请求URL
 * @returns boolean 是否跳过认证头
 */
function shouldSkipAuthHeader(url: string): boolean {
  // 兼容项目里可能存在的两套路径：/api/user/* 与 /api/auth/*
  return (
    url.includes('/api/user/login') ||
    url.includes('/api/user/register') ||
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/register')
  );
}

/**
 * 获取当前页面路径
 * @returns string 当前路径
 */
function getCurrentPathname(): string {
  if (typeof window === 'undefined') return '';
  return window.location?.pathname || '';
}

/**
 * 判断是否为公开路径
 * 这些页面不需要用户信息，也不应因为残留过期 token 而弹错
 * @param pathname 路径
 * @returns boolean 是否为公开路径
 */
function isPublicPath(pathname: string): boolean {
  return pathname === '/' || pathname === '/login' || pathname === '/register';
}

/**
 * 判断是否为用户信息API
 * @param url 请求URL
 * @returns boolean 是否为用户信息API
 */
function isUserInfoApi(url: string): boolean {
  return url.includes('/api/user/info');
}

/**
 * 判断是否为登录API
 * @param url 请求URL
 * @returns boolean 是否为登录API
 */
function isLoginApi(url: string): boolean {
  return url.includes('/api/user/login') || url.includes('/api/auth/login');
}

/**
 * axios 实例配置
 * 用于统一处理API请求
 */
const instance = axios.create({
  baseURL: 'http://localhost:3007/', // 后端API基础路径
  // baseURL: 'http://localhost:3001/', // 备用API路径
  timeout: 60 * 1000, // 超时时间：60秒
});

/**
 * 请求拦截器
 * 处理请求头、认证token等
 */
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
    // 请求错误处理
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器
 * 统一处理响应数据、错误提示等
 */
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
      
      // 解析错误信息
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

      // 使用axios自带的错误信息
      if (errMsg === '请求失败' && typeof error.message === 'string') {
        errMsg = error.message;
      }
    } else if (error instanceof Error && error.message) {
      // 非axios错误
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

    // 其他错误全局提示
    message.error(errMsg);
    return Promise.reject(new Error(errMsg));
  }
);

/**
 * axios 实例
 * 用于发起网络请求
 */
export default instance;

/**
 * 响应数据类型
 */
export type ResType = {
  errno: number;     // 错误码，0表示成功
  data?: ResDataType; // 响应数据
  msg?: string;      // 错误信息
};

/**
 * 响应数据中的data字段类型
 */
export type ResDataType = {
  [key: string]: unknown;
};
