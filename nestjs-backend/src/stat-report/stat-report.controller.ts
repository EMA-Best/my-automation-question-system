import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { StatReportService } from './stat-report.service';
import { GenerateAIReportDto } from './dto/generate-ai-report.dto';
import { Public } from '../auth/decorators/public.decorator';

@Controller('stat')
export class StatReportController {
  constructor(private readonly statReportService: StatReportService) {}

  // 获取最新 AI 报告
  @Get(':questionId/ai-report/latest')
  @Public()
  async getLatestReport(@Param('questionId') questionId: string) {
    return this.statReportService.getLatestReport(questionId);
  }

  // 获取 AI 报告任务状态
  @Get(':questionId/ai-report/tasks/:taskId')
  @Public()
  async getTaskStatus(
    @Param('questionId') questionId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.statReportService.getTaskStatus(questionId, taskId);
  }

  // 生成 AI 报告
  @Post(':questionId/ai-report/generate')
  @Public()
  async generateReport(
    @Param('questionId') questionId: string,
    @Body() payload: GenerateAIReportDto,
  ) {
    return this.statReportService.generateReport(questionId, payload);
  }

  // 重新生成 AI 报告
  @Post(':questionId/ai-report/regenerate')
  @Public()
  async regenerateReport(
    @Param('questionId') questionId: string,
    @Body() payload: GenerateAIReportDto,
  ) {
    return this.statReportService.regenerateReport(questionId, payload);
  }
}
