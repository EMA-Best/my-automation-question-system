import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  // 依赖注入用户服务和JwtService
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(username: string, password: string) {
    const user = await this.userService.findOne(username, password);

    if (!user) {
      throw new HttpException('用户名或密码错误', HttpStatus.UNAUTHORIZED);
    }

    if (user.status === 'disabled') {
      throw new HttpException('账号已被禁用', HttpStatus.FORBIDDEN);
    }

    await this.userService.updateLastLoginAt(String(user._id));

    /**
     * toObject()方法将文档变成普通的JavaScript对象
     * 利用对象结构的语法 从用户对象中提取密码字段 其他字段使用...收集到userInfo对象中
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: pwd, ...userInfo } = user.toObject();

    // 规范化：确保 token payload 里的 _id 是 string，避免下游把 ObjectId 当成 object 处理
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (userInfo as any)._id = String(user._id);

    // return userInfo; // 不返回密码
    return {
      // SSO 约定：B 端持有该 token，后续回传给 C 端 sso-callback 生成 C 会话
      token: await this.jwtService.signAsync(userInfo), // 生成JWT令牌
    };
  }
}
