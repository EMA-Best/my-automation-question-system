import axios from 'axios';
import { message } from 'antd';
import { getToken } from '../utils/user-token';

const instance = axios.create({
  timeout: 10 * 1000,
});

instance.interceptors.request.use(
  (config) => {
    // 从localStorage中获取token
    const token = getToken();
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
instance.interceptors.response.use((res) => {
  const resData = (res.data || {}) as ResType;
  const { errno, data, msg } = resData;

  // 错误提示处理
  if (errno !== 0) {
    if (msg) {
      message.error(msg);
    }
    throw new Error(msg);
  }

  return data as any;
});

export default instance;

// 定义响应数据的类型
export type ResType = {
  errno: number;
  data?: ResDataType;
  msg?: string;
};

// 定义响应数据中的data字段的类型
export type ResDataType = {
  [key: string]: any; // 字符串索引签名
};
