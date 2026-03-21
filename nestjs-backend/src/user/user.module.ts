import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  exports: [UserService], // 导出用户服务，以便其他模块可以使用
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
