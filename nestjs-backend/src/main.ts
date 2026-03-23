/**
 * 应用主入口文件
 * 初始化 NestJS 应用实例并配置全局中间件
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './transform/transform.interceptor';
import { HttpExceptionFilter } from './http-exception/http-exception.filter';
import { json, urlencoded } from 'express';

/**
 * 应用启动函数
 */
async function bootstrap() {
  console.log('MONGODB_URI:', process.env.MONGODB_URI); // 调试输出
  // 创建 NestJS 应用实例
  const app = await NestFactory.create(AppModule);

  // 支持导入较大的问卷 JSON（默认 body 限制较小，容易 413）
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true, limit: '5mb' }));

  // 路由全局前缀
  app.setGlobalPrefix('api');
  // 全局响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor());
  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());
  // 暂时禁用验证管道，以便获取更详细的错误信息
  /*
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // 自动移除未在 DTO 中定义的属性
      forbidNonWhitelisted: true, // 当发现未在 DTO 中定义的属性时抛出错误
      transform: true,           // 自动将请求数据转换为 DTO 类型
    }),
  );
  */
  // 允许跨域请求
  app.enableCors();
  // 启动应用，使用环境变量中的端口或默认端口 3005
  await app.listen(process.env.PORT ?? 3005);
}

/**
 * 启动应用并处理启动失败的情况
 */
bootstrap().catch((err) => {
  console.error('应用启动失败:', err);
  process.exit(1);
});
