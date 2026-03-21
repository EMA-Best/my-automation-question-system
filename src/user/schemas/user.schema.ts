import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true, // 自动添加 createdAt 和 updatedAt 字段 记录时间戳
})
export class User {
  @Prop({
    required: true,
    unique: true,
  })
  username: string;

  @Prop({
    required: true,
  })
  password: string;

  @Prop({
    default: '',
  })
  nickname: string;

  @Prop({
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    index: true,
  })
  role: 'user' | 'admin';

  @Prop({
    type: String,
    enum: ['active', 'disabled'],
    default: 'active',
    index: true,
  })
  status: 'active' | 'disabled';

  @Prop({
    type: Date,
    default: null,
  })
  lastLoginAt?: Date | null;

  @Prop({
    type: Boolean,
    default: false,
    index: true,
  })
  mustChangePassword: boolean;

  // 密码审计（不记录明文，仅记录时间/来源/操作者/策略/IP）
  @Prop({
    type: Date,
    default: null,
  })
  passwordUpdatedAt?: Date | null;

  @Prop({
    type: String,
    enum: ['user', 'admin', 'system'],
    default: null,
  })
  passwordUpdatedByRole?: 'user' | 'admin' | 'system' | null;

  // 对于 user：一般是 username；对于 admin：操作者 admin username
  @Prop({
    type: String,
    default: null,
  })
  passwordUpdatedBy?: string | null;

  @Prop({
    type: String,
    default: null,
  })
  passwordUpdatedIp?: string | null;

  @Prop({
    type: String,
    enum: ['random', 'default', 'manual'],
    default: null,
  })
  passwordResetStrategy?: 'random' | 'default' | 'manual' | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ role: 1, status: 1 });

// 管理端用户列表：role/status 过滤 + createdAt/_id 倒序
UserSchema.index({ role: 1, status: 1, createdAt: -1, _id: -1 });
