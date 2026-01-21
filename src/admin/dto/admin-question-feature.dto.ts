import { IsBoolean, IsOptional } from 'class-validator';

export class AdminQuestionFeatureDto {
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  pinned?: boolean;
}
