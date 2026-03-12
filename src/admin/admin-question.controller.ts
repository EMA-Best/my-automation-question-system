import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Request,
} from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { AdminQuestionService } from './admin-question.service';
import { AdminQuestionFeatureDto } from './dto/admin-question-feature.dto';
import { AdminQuestionDeleteDto } from './dto/admin-question-delete.dto';

type JwtUser = { _id?: string; username: string; role?: string };

@Controller('admin/questions')
export class AdminQuestionController {
  constructor(private readonly adminQuestionService: AdminQuestionService) {}

  @Get('deleted')
  @RequirePermissions('question:read:any')
  async listDeleted(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('keyword') keyword?: string,
    @Query('ownerKeyword') ownerKeyword?: string,
    @Query('deletedByKeyword') deletedByKeyword?: string,
    @Query('deleteReasonKeyword') deleteReasonKeyword?: string,
    @Query('deletedAtStart') deletedAtStart?: string,
    @Query('deletedAtEnd') deletedAtEnd?: string,
  ): Promise<unknown> {
    const pageNum = Number.parseInt(page, 10);
    const pageSizeNum = Number.parseInt(pageSize, 10);

    return await this.adminQuestionService.listDeleted({
      page: Number.isFinite(pageNum) ? pageNum : 1,
      pageSize: Number.isFinite(pageSizeNum) ? pageSizeNum : 10,
      keyword,
      ownerKeyword,
      deletedByKeyword,
      deleteReasonKeyword,
      deletedAtStart,
      deletedAtEnd,
    });
  }

  @Get()
  @RequirePermissions('question:read:any')
  async list(
    @Query('page') page: string = '1',
    @Query('pageNum') pageNum: string = '',
    @Query('pageSize') pageSize: string = '10',
    @Query('keyword') keyword: string = '',
    @Query('author') author: string = '',
    @Query('ownerKeyword') ownerKeyword: string = '',
    @Query('isPublished') isPublished?: string,
    @Query('isDeleted') isDeleted?: string,
    @Query('auditStatus') auditStatus?: string,
    @Query('featured') featured?: string,
    @Query('pinned') pinned?: string,
    @Query('createdAtStart') createdAtStart?: string,
    @Query('createdAtEnd') createdAtEnd?: string,
  ): Promise<unknown> {
    const actualPage = pageNum && pageNum.trim() ? pageNum : page;
    const parsedPage = Number.parseInt(actualPage, 10);
    const pageSizeNum = Number.parseInt(pageSize, 10);

    return await this.adminQuestionService.list({
      page: Number.isFinite(parsedPage) ? parsedPage : 1,
      pageSize: Number.isFinite(pageSizeNum) ? pageSizeNum : 10,
      keyword,
      author,
      ownerKeyword,
      isPublished,
      isDeleted,
      auditStatus,
      featured,
      pinned,
      createdAtStart,
      createdAtEnd,
    });
  }

  @Patch(':id/restore')
  @RequirePermissions('question:update:any')
  async restore(
    @Param('id') id: string,
    @Request() req: { user: JwtUser },
  ): Promise<unknown> {
    const operatorId = req.user._id || req.user.username;
    return await this.adminQuestionService.restore(id, operatorId);
  }

  @Patch(':id/delete')
  @RequirePermissions('question:update:any')
  async softDelete(
    @Param('id') id: string,
    @Body() body: AdminQuestionDeleteDto,
    @Request() req: { user: JwtUser },
  ): Promise<unknown> {
    const operatorId = req.user._id || req.user.username;
    return await this.adminQuestionService.softDelete(
      id,
      operatorId,
      body.reason,
    );
  }

  @Delete(':id/permanent')
  @RequirePermissions('question:update:any')
  async permanentDelete(
    @Param('id') id: string,
    @Request() req: { user: JwtUser },
  ): Promise<unknown> {
    const operatorId = req.user._id || req.user.username;
    return await this.adminQuestionService.permanentDelete(id, operatorId);
  }

  @Get(':id')
  @RequirePermissions('question:read:any')
  async detail(@Param('id') id: string): Promise<unknown> {
    return await this.adminQuestionService.detail(id);
  }

  @Patch(':id/unpublish')
  @RequirePermissions('question:update:any')
  async unpublish(@Param('id') id: string): Promise<unknown> {
    return await this.adminQuestionService.unpublish(id);
  }

  @Patch(':id/publish')
  @RequirePermissions('question:update:any')
  async publish(@Param('id') id: string): Promise<unknown> {
    return await this.adminQuestionService.publish(id);
  }

  @Patch(':id/feature')
  @RequirePermissions('question:feature')
  async feature(
    @Param('id') id: string,
    @Body() body: AdminQuestionFeatureDto,
  ): Promise<unknown> {
    return await this.adminQuestionService.feature(id, body);
  }
}
