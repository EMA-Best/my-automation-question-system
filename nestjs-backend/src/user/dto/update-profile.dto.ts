import { IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @Length(2, 20, { message: '昵称长度必须在2到20个字符之间' })
  nickname: string;
}
