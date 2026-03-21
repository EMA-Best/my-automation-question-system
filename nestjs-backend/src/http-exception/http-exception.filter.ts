import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const message = exception.message ? exception.message : '服务器错误';

    response.status(status).json({
      // statusCode: status,
      errno: -1, // 错误码
      message, // 错误信息
      timestamp: new Date().toISOString(), // 时间戳
      path: request.url, // 请求路径
    });
  }
}
