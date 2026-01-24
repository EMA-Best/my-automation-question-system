import { Controller, Get, Param, Query } from '@nestjs/common';
import { StatService, HomeOverviewStat } from './stat.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('stat')
export class StatController {
  // 依赖注入StatService
  constructor(private readonly statService: StatService) {}

  // 把 @Get('overview') 放到 @Get(':questionId') 之前，避免 /stat/overview 被参数路由当成 questionId=overview 抢先匹配（这种情况下就算写了 overview 方法也可能根本没命中）
  // 首页统计：创建问卷数、发布问卷数、答卷总数
  // 公开接口：不需要登录
  @Public()
  @Get('overview')
  getOverview(): Promise<HomeOverviewStat> {
    return this.statService.getOverview();
  }

  // 获取问卷的统计信息
  @Get(':questionId')
  async getQuestionStat(
    @Param('questionId') questionId: string,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
  ) {
    return await this.statService.getQuestionStatListAndCount(questionId, {
      page,
      pageSize,
    });
  }

  // 获取组件的统计信息
  @Get(':questionId/:componentFeId')
  async getComponentStat(
    @Param('questionId') questionId: string,
    @Param('componentFeId') componentFeId: string,
  ) {
    const stat = await this.statService.getComponentStat(
      questionId,
      componentFeId,
    );
    return { stat };
  }
}
