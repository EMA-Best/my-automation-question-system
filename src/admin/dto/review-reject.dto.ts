import { IsString, Length } from 'class-validator';

export class ReviewRejectDto {
  @IsString()
  @Length(1, 200, { message: '驳回原因长度必须在1到200个字符之间' })
  reason: string;
}
