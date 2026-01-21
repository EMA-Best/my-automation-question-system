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
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ role: 1, status: 1 });
