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

    /**
     * toObject()方法将文档变成普通的JavaScript对象
     * 利用对象结构的语法 从用户对象中提取密码字段 其他字段使用...收集到userInfo对象中
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: pwd, ...userInfo } = user.toObject();

    // return userInfo; // 不返回密码
    return {
      token: await this.jwtService.signAsync(userInfo), // 生成JWT令牌
    };
  }
}
