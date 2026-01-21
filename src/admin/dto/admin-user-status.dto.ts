import { IsIn } from 'class-validator';

export class AdminUserStatusDto {
  @IsIn(['active', 'disabled'], { message: 'status 必须是 active 或 disabled' })
  status: 'active' | 'disabled';
}
