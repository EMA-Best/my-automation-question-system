/**
 * 应用控制器
 * 处理应用的根路径请求
 */
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * 获取应用欢迎信息
   * @returns 欢迎信息字符串
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
