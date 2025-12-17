import { Controller, Get, Param, Query } from '@nestjs/common';
import { StatService } from './stat.service';

@Controller('stat')
export class StatController {
  // 依赖注入StatService
  constructor(private readonly statService: StatService) {}

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
