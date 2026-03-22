/**
 * 用户令牌管理工具
 * 负责 token 的存储、获取和移除操作
 */

/**
 * token 存储的本地存储键名
 */
const KEY = 'USER_TOKEN';

/**
 * 存储用户token到本地存储
 * @param token JWT令牌
 */
export function setToken(token: string) {
  localStorage.setItem(KEY, token);
}

/**
 * 从本地存储获取用户token
 * @returns string 用户token，如果不存在则返回空字符串
 */
export function getToken() {
  return localStorage.getItem(KEY) || '';
}

/**
 * 从本地存储移除用户token
 */
export function removeToken() {
  localStorage.removeItem(KEY);
}
