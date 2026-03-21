export class GenerateAIReportDto {
  mode?: 'quick' | 'standard' | 'deep';
  timeRange?: 'all' | '7d' | '30d';
  includeTextAnswers?: boolean;
  maxAnswers?: number;
}
