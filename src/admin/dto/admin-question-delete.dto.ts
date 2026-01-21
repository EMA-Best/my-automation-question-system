import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AdminQuestionDeleteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  reason!: string;
}
