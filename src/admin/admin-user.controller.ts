import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { AdminUserService } from './admin-user.service';
import { AdminUserStatusDto } from './dto/admin-user-status.dto';
import { AdminUserRoleDto } from './dto/admin-user-role.dto';
import { AdminUserResetPasswordDto } from './dto/admin-user-reset-password.dto';

type JwtUser = { username: string; role?: string };

@Controller('admin/users')
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get()
  @RequirePermissions('user:read')
  async list(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('keyword') keyword: string = '',
    @Query('role') role?: string,
    @Query('status') status?: string,
  ): Promise<unknown> {
    const pageNum = Number.parseInt(page, 10);
    const pageSizeNum = Number.parseInt(pageSize, 10);

    return await this.adminUserService.list({
      page: Number.isFinite(pageNum) ? pageNum : 1,
      pageSize: Number.isFinite(pageSizeNum) ? pageSizeNum : 10,
      keyword,
      role,
      status,
    });
  }

  @Patch(':id/status')
  @RequirePermissions('user:update')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: AdminUserStatusDto,
  ): Promise<unknown> {
    return await this.adminUserService.updateStatus(id, body.status);
  }

  @Patch(':id/role')
  @RequirePermissions('user:update')
  async updateRole(
    @Param('id') id: string,
    @Body() body: AdminUserRoleDto,
    @Request() req: { user: JwtUser },
  ): Promise<unknown> {
    return await this.adminUserService.updateRole(
      id,
      body.role,
      req.user.username,
    );
  }

  @Post(':id/reset-password')
  @RequirePermissions('user:resetPassword')
  async resetPassword(
    @Param('id') id: string,
    @Body() body: AdminUserResetPasswordDto,
    @Request() req: { user: JwtUser; ip?: unknown },
  ): Promise<unknown> {
    const ip = typeof req.ip === 'string' ? req.ip : undefined;
    return await this.adminUserService.resetPassword({
      targetUserId: id,
      strategy: body.strategy,
      newPassword: body.newPassword,
      actorUsername: req.user.username,
      ip,
    });
  }

  @Delete(':id')
  @RequirePermissions('user:delete')
  async deleteUser(
    @Param('id') id: string,
    @Request() req: { user: JwtUser },
  ): Promise<unknown> {
    return await this.adminUserService.deleteUser(id, req.user.username);
  }
}
