/**
 * 认证服务
 * 处理用户登录和认证相关功能
 */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  /**
   * 构造函数
   * @param userService 用户服务实例
   * @param jwtService JWT服务实例
   */
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 用户登录
   * @param username 用户名
   * @param password 密码
   * @returns 包含JWT令牌的对象
   * @throws 当用户名或密码错误时，抛出401错误
   * @throws 当账号被禁用时，抛出403错误
   */
  async signIn(username: string, password: string) {
    // 验证用户凭据
    const user = await this.userService.findOne(username, password);

    // 检查用户是否存在
    if (!user) {
      throw new HttpException('用户名或密码错误', HttpStatus.UNAUTHORIZED);
    }

    // 检查用户状态
    if (user.status === 'disabled') {
      throw new HttpException('账号已被禁用', HttpStatus.FORBIDDEN);
    }

    // 更新用户最后登录时间
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

    // 生成JWT令牌并返回
    return {
      // SSO 约定：B 端持有该 token，后续回传给 C 端 sso-callback 生成 C 会话
      token: await this.jwtService.signAsync(userInfo),
    };
  }
}
