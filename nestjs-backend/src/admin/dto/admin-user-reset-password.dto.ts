import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class AdminUserResetPasswordDto {
  @IsOptional()
  @IsIn(['random', 'default'], {
    message: "strategy 必须是 'random' 或 'default'",
  })
  strategy?: 'random' | 'default';

  @IsOptional()
  @IsString()
  @Length(6, 12, { message: 'newPassword 长度必须在6到12个字符之间' })
  newPassword?: string;
}
