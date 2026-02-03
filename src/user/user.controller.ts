import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  Redirect,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

type JwtUser = { _id?: unknown; username?: unknown };
type AuthedRequest = { user?: JwtUser; ip?: unknown };

function getUserIdFromReq(req: AuthedRequest): string {
  const raw = req.user?._id;
  if (typeof raw === 'string') return raw;
  return '';
}

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
  async info(@Request() req: AuthedRequest) {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      throw new HttpException('未登录', HttpStatus.UNAUTHORIZED);
    }
    return await this.userService.getUserInfo(userId);
  }

  // 用户登录
  @Public()
  @Post('login')
  @Redirect('/api/auth/login', 307) // http状态码 POST - 307临时重定向 308永久重定向
  login() {
    return;
  }

  // 更新用户昵称（需登录）
  @Patch('profile')
  async updateProfile(
    @Body() body: UpdateProfileDto,
    @Request() req: AuthedRequest,
  ) {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      throw new HttpException('未登录', HttpStatus.UNAUTHORIZED);
    }
    return await this.userService.updateNickname(userId, body.nickname);
  }

  // 修改用户密码（需登录）
  @Patch('password')
  async updatePassword(
    @Body() body: UpdatePasswordDto,
    @Request() req: AuthedRequest,
  ) {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      throw new HttpException('未登录', HttpStatus.UNAUTHORIZED);
    }

    const actorUsername =
      typeof req.user?.username === 'string' ? req.user.username : undefined;
    const ip = typeof req.ip === 'string' ? req.ip : undefined;
    return await this.userService.changePassword(
      userId,
      body.oldPassword,
      body.newPassword,
      { actorUsername, ip },
    );
  }
}
