import { IsString, Length } from 'class-validator';

export class LoginDto {
  @IsString()
  @Length(6, 10, { message: '用户名长度必须在6到10个字符之间' })
  username: string;

  @IsString()
  @Length(6, 12, { message: '密码长度必须在6到12个字符之间' })
  password: string;
}
