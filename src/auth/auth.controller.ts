import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
// import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  // 依赖注入
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() userInfo: LoginDto) {
    const { username, password } = userInfo;
    return await this.authService.signIn(username, password);
  }

  // 增加guard验证
  // @UseGuards(AuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return await req.user;
  }
}
