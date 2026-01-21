import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { User, type UserDocument } from '../user/schemas/user.schema';

export type AdminUserListItem = {
  _id: unknown;
  username: string;
  nickname: string;
  role: 'user' | 'admin';
  status: 'active' | 'disabled';
  createdAt?: Date;
  updatedAt?: Date;
  lastLoginAt?: Date | null;
};

@Injectable()
export class AdminUserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async list(params: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    role?: string;
    status?: string;
  }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize =
      params.pageSize && params.pageSize > 0 ? params.pageSize : 10;

    const filter: Record<string, unknown> = {};

    if (params.role === 'admin' || params.role === 'user') {
      filter.role = params.role;
    }

    if (params.status === 'active' || params.status === 'disabled') {
      filter.status = params.status;
    }

    const keyword =
      typeof params.keyword === 'string' ? params.keyword.trim() : '';
    if (keyword) {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      filter.$or = [{ username: regex }, { nickname: regex }];
    }

    const [list, count] = await Promise.all([
      this.userModel
        .find(filter)
        .select({ password: 0 })
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<AdminUserListItem[]>(),
      this.userModel.countDocuments(filter),
    ]);

    return { list, count, page, pageSize };
  }

  async updateStatus(targetUserId: string, status: 'active' | 'disabled') {
    const user = await this.userModel.findById(targetUserId);
    if (!user) throw new NotFoundException('用户不存在');

    user.status = status;
    await user.save();

    return { ok: true };
  }

  async updateRole(
    targetUserId: string,
    role: 'user' | 'admin',
    actorUsername: string,
  ) {
    const user = await this.userModel.findById(targetUserId);
    if (!user) throw new NotFoundException('用户不存在');

    if (user.username === actorUsername) {
      throw new ForbiddenException('禁止修改自己的角色');
    }

    user.role = role;
    await user.save();

    return { ok: true };
  }

  async resetPassword(params: {
    targetUserId: string;
    strategy?: 'random' | 'default';
    newPassword?: string;
  }) {
    const user = await this.userModel.findById(params.targetUserId);
    if (!user) throw new NotFoundException('用户不存在');

    if (params.newPassword && params.newPassword.trim()) {
      user.password = params.newPassword;
      await user.save();
      return { ok: true };
    }

    const strategy = params.strategy ?? 'default';

    if (strategy === 'default') {
      const defaultPassword = process.env.DEFAULT_RESET_PASSWORD ?? '123456';
      if (defaultPassword.length < 6 || defaultPassword.length > 12) {
        throw new BadRequestException(
          'DEFAULT_RESET_PASSWORD 长度必须在6到12个字符之间',
        );
      }
      user.password = defaultPassword;
      await user.save();
      return { ok: true, strategy: 'default' };
    }

    // random
    const randomPassword = this.generateTempPassword(10);
    user.password = randomPassword;
    await user.save();

    // 注意：这里会把临时密码回传给管理员前端（仅用于一次性展示）
    return { ok: true, strategy: 'random', tempPassword: randomPassword };
  }

  async deleteUser(targetUserId: string, actorUsername: string) {
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      throw new NotFoundException('用户不存在');
    }

    const user = await this.userModel.findById(targetUserId);
    if (!user) throw new NotFoundException('用户不存在');

    if (user.username === actorUsername) {
      throw new ForbiddenException('禁止删除自己');
    }

    if (user.role === 'admin') {
      throw new ForbiddenException('禁止删除管理员账号');
    }

    await this.userModel.findByIdAndDelete(user._id);
    return { ok: true };
  }

  private generateTempPassword(length: number) {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < length; i += 1) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return out;
  }
}
