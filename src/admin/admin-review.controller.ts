import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { AdminReviewService } from './admin-review.service';
import { ReviewApproveDto } from './dto/review-approve.dto';
import { ReviewRejectDto } from './dto/review-reject.dto';

type JwtUser = { username: string; role?: string };

@Controller('admin/reviews')
export class AdminReviewController {
  constructor(private readonly adminReviewService: AdminReviewService) {}

  @Get()
  @RequirePermissions('review:read')
  async list(
    @Query('status') status?: 'pending' | 'approved' | 'rejected',
    @Query('keyword') keyword?: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
  ) {
    const pageNum = Number.parseInt(page, 10);
    const pageSizeNum = Number.parseInt(pageSize, 10);

    return await this.adminReviewService.list({
      status,
      keyword,
      page: Number.isFinite(pageNum) ? pageNum : 1,
      pageSize: Number.isFinite(pageSizeNum) ? pageSizeNum : 10,
    });
  }

  @Post(':questionId/approve')
  @RequirePermissions('review:approve')
  async approve(
    @Param('questionId') questionId: string,
    @Body() body: ReviewApproveDto,
    @Request() req: { user: JwtUser },
  ) {
    const reviewer = req.user.username;
    return await this.adminReviewService.approve(
      questionId,
      reviewer,
      body.autoPublish,
    );
  }

  @Post(':questionId/reject')
  @RequirePermissions('review:reject')
  async reject(
    @Param('questionId') questionId: string,
    @Body() body: ReviewRejectDto,
    @Request() req: { user: JwtUser },
  ) {
    const reviewer = req.user.username;
    return await this.adminReviewService.reject(
      questionId,
      reviewer,
      body.reason,
    );
  }
}
