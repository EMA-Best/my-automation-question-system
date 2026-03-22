/**
 * 应用服务
 * 提供应用的基础功能
 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  /**
   * 获取应用欢迎信息
   * @returns 欢迎信息字符串
   */
  getHello(): string {
    return 'Hello Nest World!';
  }
}
