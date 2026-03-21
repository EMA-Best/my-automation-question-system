import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { hashPassword, isBcryptHash, verifyPassword } from './password.util';

@Injectable()
export class UserService {
  // 依赖注入用户模型
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(userData: CreateUserDto) {
    const hashedPassword = await hashPassword(userData.password);
    const createdUser = new this.userModel({
      ...userData,
      password: hashedPassword,
    });
    return await createdUser.save();
  }

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

  async updateLastLoginAt(userId: string) {
    return await this.userModel.updateOne(
      { _id: userId },
      { $set: { lastLoginAt: new Date() } },
    );
  }
}
