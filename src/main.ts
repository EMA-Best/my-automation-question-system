import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './transform/transform.interceptor';
import { HttpExceptionFilter } from './http-exception/http-exception.filter';
import { json, urlencoded } from 'express';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 支持导入较大的问卷 JSON（默认 body 限制较小，容易 413）
  app.use(json({ limit: '5mb' }));
  app.use(urlencoded({ extended: true, limit: '5mb' }));

  app.setGlobalPrefix('api'); // 路由全局前缀
  app.useGlobalInterceptors(new TransformInterceptor()); // 全局拦截器
  app.useGlobalFilters(new HttpExceptionFilter()); // 全局异常过滤器
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors(); // 允许跨域请求
  await app.listen(process.env.PORT ?? 3005);
}
//bootstrap();
bootstrap().catch((err) => {
  console.error('应用启动失败:', err);
  process.exit(1);
});
