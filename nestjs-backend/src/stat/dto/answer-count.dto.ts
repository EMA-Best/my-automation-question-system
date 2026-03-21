import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsMongoId,
} from 'class-validator';

export class AnswerCountDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'questionIds 不能为空' })
  @ArrayMaxSize(200, { message: 'questionIds 长度不能超过 200' })
  @IsMongoId({ each: true, message: 'questionIds 中包含非法 questionId' })
  questionIds: string[];
}
