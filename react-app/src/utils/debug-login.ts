// 用于调试登录服务的返回值结构
import { loginService } from '../services/user';

async function debugLogin() {
  try {
    const result = await loginService('test', 'test123');
    console.log('Login service result:', result);
  } catch (error) {
    console.error('Login error:', error);
  }
}

debugLogin();
