/**
 * 用户服务
 * 处理用户相关的业务逻辑
 */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { hashPassword, isBcryptHash, verifyPassword } from './password.util';

function isDuplicateUsernameError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const record = error as Record<string, unknown>;
  const code = record.code;
  const keyPattern = record.keyPattern;

  const isMongoDuplicateKey = code === 11000;
  const duplicateOnUsername =
    typeof keyPattern === 'object' &&
    keyPattern !== null &&
    'username' in (keyPattern as Record<string, unknown>);

  return isMongoDuplicateKey && duplicateOnUsername;
}

@Injectable()
export class UserService {
  /**
   * 构造函数
   * @param userModel 用户模型实例
   */
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  /**
   * 创建新用户
   * @param userData 用户数据
   * @returns 创建的用户对象
   */
  async create(userData: CreateUserDto) {
    const exists = await this.userModel.exists({ username: userData.username });
    if (exists) {
      throw new HttpException('用户名已存在', HttpStatus.BAD_REQUEST);
    }

    // 密码加密
    const hashedPassword = await hashPassword(userData.password);
    const createdUser = new this.userModel({
      ...userData,
      password: hashedPassword,
    });

    try {
      return await createdUser.save();
    } catch (error) {
      if (isDuplicateUsernameError(error)) {
        throw new HttpException('用户名已存在', HttpStatus.BAD_REQUEST);
      }
      throw error;
    }
  }

  /**
   * 根据用户名和密码查找用户
   * @param username 用户名
   * @param password 密码
   * @returns 用户对象，如果用户名或密码错误则返回null
   */
  async findOne(username: string, password: string) {
    const user = await this.userModel.findOne({ username });
    if (!user) return null;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const storedPassword = (user as any).password as string;
    const ok = await verifyPassword(password, storedPassword);
    if (!ok) return null;

    // 渐进式迁移：历史明文密码在成功登录后升级为 bcrypt hash
    if (
      typeof storedPassword === 'string' &&
      storedPassword &&
      !isBcryptHash(storedPassword)
    ) {
      const hashed = await hashPassword(password);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (user as any).password = hashed;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (user as any).passwordUpdatedAt = new Date();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (user as any).passwordUpdatedByRole = 'system';
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      (user as any).passwordUpdatedBy = 'migrate';
      await user.save();
    }

    return user;
  }

  /**
   * 获取用户信息
   * @param userId 用户ID
   * @returns 用户信息对象
   * @throws 当用户不存在时，抛出404错误
   */
  async getUserInfo(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const username = (user as any).username as string;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const nickname = (user as any).nickname as string;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const role = (user as any).role as 'user' | 'admin';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const mustChangePassword = Boolean((user as any).mustChangePassword);

    return { username, nickname, role, mustChangePassword };
  }

  /**
   * 更新用户昵称
   * @param userId 用户ID
   * @param nickname 新昵称
   * @returns 更新后的用户信息
   * @throws 当用户不存在时，抛出404错误
   */
  async updateNickname(userId: string, nickname: string) {
    const updated = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { nickname } },
      { new: true },
    );

    if (!updated) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const username = (updated as any).username as string;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const role = (updated as any).role as 'user' | 'admin';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const nick = (updated as any).nickname as string;

    return { username, nickname: nick, role };
  }

  /**
   * 修改用户密码
   * @param userId 用户ID
   * @param oldPassword 旧密码
   * @param newPassword 新密码
   * @param meta 元数据，包含操作者用户名和IP地址
   * @returns 空对象
   * @throws 当用户不存在时，抛出404错误
   * @throws 当旧密码不正确时，抛出400错误
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
    meta?: { actorUsername?: string; ip?: string },
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const storedPassword = (user as any).password as string;
    const ok = await verifyPassword(oldPassword, storedPassword);
    if (!ok) {
      throw new HttpException('旧密码不正确', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await hashPassword(newPassword);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (user as any).password = hashedPassword;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (user as any).mustChangePassword = false;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (user as any).passwordUpdatedAt = new Date();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (user as any).passwordUpdatedByRole = 'user';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (user as any).passwordUpdatedBy = meta?.actorUsername ?? null;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (user as any).passwordUpdatedIp = meta?.ip ?? null;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (user as any).passwordResetStrategy = null;
    await user.save();

    return {};
  }

  /**
   * 更新用户最后登录时间
   * @param userId 用户ID
   * @returns 更新结果
   */
  async updateLastLoginAt(userId: string) {
    return await this.userModel.updateOne(
      { _id: userId },
      { $set: { lastLoginAt: new Date() } },
    );
  }
}
