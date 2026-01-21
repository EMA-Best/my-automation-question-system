import { Injectable } from '@nestjs/common';
import { User } from './schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  // 依赖注入用户模型
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async create(userData: CreateUserDto) {
    const createdUser = new this.userModel(userData);
    return await createdUser.save();
  }

  async findOne(username: string, password: string) {
    return await this.userModel.findOne({ username, password });
  }

  async updateLastLoginAt(userId: string) {
    return await this.userModel.updateOne(
      { _id: userId },
      { $set: { lastLoginAt: new Date() } },
    );
  }
}
