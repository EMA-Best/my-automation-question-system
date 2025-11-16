/**
 * @description token 相关操作
 */

const KEY = 'USER_TOKEN';

// 存储token
export function setToken(token: string) {
  localStorage.setItem(KEY, token);
}

// 获取token
export function getToken() {
  return localStorage.getItem(KEY) || '';
}

// 移除token
export function removeToken() {
  localStorage.removeItem(KEY);
}
