import { IsOptional, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(6, 10, { message: '用户名长度必须在6到10个字符之间' })
  readonly username: string; // 用户名

  @IsString()
  @Length(6, 12, { message: '密码长度必须在6到12个字符之间' })
  readonly password: string; // 密码

  @IsOptional()
  @IsString()
  @Length(0, 20, { message: '昵称长度不能超过20个字符' })
  readonly nickname?: string; // 昵称
}
