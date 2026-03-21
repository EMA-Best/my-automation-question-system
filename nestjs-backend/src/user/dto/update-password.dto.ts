import { IsString, Length } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  @Length(6, 12, { message: '旧密码长度必须在6到12个字符之间' })
  oldPassword: string;

  @IsString()
  @Length(6, 12, { message: '新密码长度必须在6到12个字符之间' })
  newPassword: string;
}
