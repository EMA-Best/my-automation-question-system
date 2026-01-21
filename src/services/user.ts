import axios, { ResDataType } from './ajax';
import type { UserInfo, UserRole } from '../types/user';

export type LoginRes = {
  token: string;
};

function isUserRole(value: unknown): value is UserRole {
  return value === 'user' || value === 'admin';
}

function normalizeUserInfo(data: unknown): UserInfo {
  if (typeof data !== 'object' || data === null) {
    throw new Error('用户信息格式错误');
  }

  const record = data as Record<string, unknown>;
  const username = typeof record.username === 'string' ? record.username : '';
  const nickname = typeof record.nickname === 'string' ? record.nickname : '';
  const role = isUserRole(record.role) ? record.role : 'user';

  return { username, nickname, role };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeLoginRes(data: unknown): LoginRes {
  if (!isRecord(data)) throw new Error('登录返回格式错误');
  const token = data.token;
  if (typeof token !== 'string' || token.length === 0) {
    throw new Error('登录 token 缺失');
  }
  return { token };
}

// 获取用户信息
export async function getUserInfoService(): Promise<UserInfo> {
  const url = `/api/user/info`;
  const data = (await axios.get(url)) as unknown;
  return normalizeUserInfo(data);
}

// 注册用户
export async function registerService(
  username: string,
  password: string,
  nickname?: string
): Promise<ResDataType> {
  const url = '/api/user/register';
  const body = { username, password, nickname: nickname || username };
  const data = (await axios.post(url, body)) as ResDataType;
  return data;
}

// 登录
export async function loginService(
  username: string,
  password: string
): Promise<LoginRes> {
  const url = '/api/user/login';
  const body = { username, password };
  const data = (await axios.post(url, body)) as unknown;
  return normalizeLoginRes(data);
}
