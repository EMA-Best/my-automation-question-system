import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class AIGenerateQuestionDto {
  @IsString()
  @IsNotEmpty({ message: 'prompt 不能为空' })
  @MaxLength(2000, { message: 'prompt 长度不能超过2000字符' })
  prompt: string;
}
