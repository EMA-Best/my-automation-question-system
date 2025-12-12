import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Redirect,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('user')
export class UserController {
  // 依赖注入用户服务
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post('register')
  async register(@Body() userDto: CreateUserDto) {
    try {
      return await this.userService.create(userDto);
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  // 获取用户信息
  @Get('info')
  @Redirect('/api/auth/profile', 302) // http状态码 GET - 301永久重定向 302临时重定向
  info() {
    return;
  }

  // 用户登录
  @Public()
  @Post('login')
  @Redirect('/api/auth/login', 307) // http状态码 POST - 307临时重定向 308永久重定向
  login() {
    return;
  }
}
