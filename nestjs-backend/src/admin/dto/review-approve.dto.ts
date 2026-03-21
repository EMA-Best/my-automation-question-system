import { IsBoolean, IsOptional } from 'class-validator';

export class ReviewApproveDto {
  @IsOptional()
  @IsBoolean()
  autoPublish?: boolean;
}
