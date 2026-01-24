import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  private readonly bcryptSaltRounds = 10;

  // 依赖注入用户模型
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  private isBcryptHash(stored: string): boolean {
    return /^\$2[aby]\$\d{2}\$/.test(stored);
  }

  private async verifyPassword(
    plainPassword: string,
    storedPassword: string,
  ): Promise<boolean> {
    if (this.isBcryptHash(storedPassword)) {
      return await bcrypt.compare(plainPassword, storedPassword);
    }
    return plainPassword === storedPassword;
  }

  private async hashPassword(plainPassword: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.bcryptSaltRounds);
    return await bcrypt.hash(plainPassword, salt);
  }

  async create(userData: CreateUserDto) {
    const hashedPassword = await this.hashPassword(userData.password);
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
    const ok = await this.verifyPassword(password, storedPassword);
    if (!ok) return null;

    return user;
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
  ) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('用户不存在', HttpStatus.NOT_FOUND);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const storedPassword = (user as any).password as string;
    const ok = await this.verifyPassword(oldPassword, storedPassword);
    if (!ok) {
      throw new HttpException('旧密码不正确', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await this.hashPassword(newPassword);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (user as any).password = hashedPassword;
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
