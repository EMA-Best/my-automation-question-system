import { IsIn } from 'class-validator';

export class AdminUserRoleDto {
  @IsIn(['user', 'admin'], { message: 'role 必须是 user 或 admin' })
  role: 'user' | 'admin';
}
