import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AIReport, AIReportDocument } from './schemas/ai-report.schema';
import { Question } from '../question/schemas/question.schema';
import { Answer, AnswerDocument } from '../answer/schemas/answer.schema';
import { AIService } from '../ai/ai.service';
import { StatService } from '../stat/stat.service';
import { GenerateAIReportDto } from './dto/generate-ai-report.dto';

@Injectable()
export class StatReportService {
  constructor(
    @InjectModel(AIReport.name) private aiReportModel: Model<AIReportDocument>,
    @InjectModel(Question.name) private questionModel: Model<Question>,
    @InjectModel(Answer.name) private answerModel: Model<AnswerDocument>,
    private aiService: AIService,
    private statService: StatService,
  ) {}

  // 获取最新 AI 报告
  async getLatestReport(questionId: string) {
    const report = await this.aiReportModel
      .findOne({ questionId, status: 'succeeded' })
      .sort({ createdAt: -1 })
      .exec();

    if (!report) {
      return null;
    }

    return report.report;
  }

  // 获取任务状态
  async getTaskStatus(questionId: string, taskId: string) {
    let task: AIReportDocument | null = null;
    try {
      task = await this.aiReportModel
        .findOne({ _id: taskId, questionId })
        .exec();
    } catch {
      throw new NotFoundException('任务不存在');
    }

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    return {
      taskId,
      status: task.status,
      errorMessage: task.errorMessage || null,
      report: task.status === 'succeeded' ? task.report : null,
      createdAt: (task as any).createdAt,
      updatedAt: (task as any).updatedAt,
    };
  }

  // 生成 AI 报告
  async generateReport(questionId: string, payload: GenerateAIReportDto) {
    const normalizedPayload = this.normalizePayload(payload);

    const question = await this.questionModel.findById(questionId).exec();
    if (!question) {
      throw new NotFoundException('问卷不存在');
    }

    if (!question.isPublished) {
      throw new BadRequestException('问卷未发布，无法生成报告');
    }

    const task = await this.aiReportModel.create({
      questionId,
      questionTitle: question.title,
      status: 'pending',
      answerCount: 0,
      validAnswerCount: 0,
      filters: normalizedPayload,
      report: this.createEmptyReport(),
      modelInfo: {
        provider: 'deepseek',
        model: 'deepseek-chat',
        temperature: 0.3,
        generatedAt: new Date(),
      },
      errorMessage: '',
      createdBy: 'system',
    });

    const taskId = (task as any)._id.toString();

    // 异步执行，接口立即返回 taskId
    setTimeout(() => {
      void this.executeReportTask(taskId, questionId, normalizedPayload);
    }, 0);

    return {
      taskId,
      status: 'pending',
    };
  }

  private async executeReportTask(
    taskId: string,
    questionId: string,
    payload: GenerateAIReportDto,
  ) {
    try {
      await this.aiReportModel.findByIdAndUpdate(taskId, {
        status: 'processing',
        errorMessage: '',
      });

      const question = await this.questionModel.findById(questionId).exec();
      if (!question) {
        throw new NotFoundException('问卷不存在');
      }

      if (!question.isPublished) {
        throw new BadRequestException('问卷未发布，无法生成报告');
      }

      const answers = await this.getAnswers(questionId, payload);
      if (answers.length === 0) {
        throw new BadRequestException('暂无答卷数据，无法生成报告');
      }

      const aggregatedData = await this.aggregateData(question, answers);
      const prompt = this.buildPrompt(aggregatedData);

      const aiResponse = await this.aiService.generateContent({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的数据分析助手，负责分析问卷数据并生成结构化的分析报告。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: this.resolveMaxTokens(payload),
        temperature: 0.3,
      });

      const reportData = this.parseAIResponse(aiResponse, aggregatedData);

      await this.aiReportModel.findByIdAndUpdate(taskId, {
        status: 'succeeded',
        questionTitle: question.title,
        answerCount: answers.length,
        validAnswerCount: answers.length,
        filters: payload,
        report: reportData,
        modelInfo: {
          provider: 'deepseek',
          model: 'deepseek-chat',
          temperature: 0.3,
          generatedAt: new Date(),
        },
        errorMessage: '',
      });
    } catch (error) {
      const errorMessage = this.getErrorMessage(error);
      await this.aiReportModel.findByIdAndUpdate(taskId, {
        status: 'failed',
        errorMessage,
      });
    }
  }

  // 重新生成 AI 报告
  async regenerateReport(questionId: string, payload: GenerateAIReportDto) {
    return this.generateReport(questionId, payload);
  }

  private normalizePayload(payload?: GenerateAIReportDto): GenerateAIReportDto {
    return {
      mode: payload?.mode || 'standard',
      timeRange: payload?.timeRange || 'all',
      includeTextAnswers: payload?.includeTextAnswers ?? true,
      maxAnswers: payload?.maxAnswers,
    };
  }

  private createEmptyReport() {
    return {
      summary: { headline: '', brief: '' },
      highlights: [],
      sampleOverview: {
        totalAnswers: 0,
        validAnswers: 0,
        textCoverage: 0,
      },
      questionInsights: [],
      risks: [],
      recommendations: [],
      confidenceNotes: [],
    };
  }

  private getErrorMessage(error: unknown): string {
    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    ) {
      const response = error.getResponse();
      if (typeof response === 'string') return response;
      if (response && typeof response === 'object') {
        const msg = (response as any).message;
        if (typeof msg === 'string') return msg;
        if (Array.isArray(msg) && typeof msg[0] === 'string') return msg[0];
      }
      return error.message;
    }

    if (error instanceof Error) return error.message;
    return '生成报告时发生未知错误';
  }

  // 按条件获取答卷
  private async getAnswers(questionId: string, payload: GenerateAIReportDto) {
    const query: any = { questionId };

    // 时间范围过滤
    if (payload.timeRange && payload.timeRange !== 'all') {
      const now = new Date();
      let startDate: Date | undefined;

      if (payload.timeRange === '7d') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (payload.timeRange === '30d') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      if (startDate) {
        query.createdAt = { $gte: startDate };
      }
    }

    // 按模式限制样本，避免 prompt 过大导致 AI 超时
    const limit = this.resolveMaxAnswers(payload);

    return this.answerModel.find(query).limit(limit).exec();
  }

  private resolveMaxAnswers(payload: GenerateAIReportDto): number {
    const mode = payload.mode || 'standard';
    const modeDefault = mode === 'quick' ? 80 : mode === 'deep' ? 300 : 180;
    const requestLimit =
      typeof payload.maxAnswers === 'number' && payload.maxAnswers > 0
        ? payload.maxAnswers
        : modeDefault;
    return Math.min(requestLimit, 300);
  }

  private resolveMaxTokens(payload: GenerateAIReportDto): number {
    const mode = payload.mode || 'standard';
    if (mode === 'quick') return 1000;
    if (mode === 'deep') return 1800;
    return 1400;
  }

  // 数据聚合与脱敏
  private async aggregateData(question: Question, answers: AnswerDocument[]) {
    const aggregated: any = {
      questionTitle: question.title,
      questionCount: question.componentList.length,
      answerCount: answers.length,
      questions: [],
    };

    // 按题目聚合数据
    for (const component of question.componentList) {
      const textTypes = new Set(['questionInput', 'questionTextarea', 'text']);
      const singleChoiceTypes = new Set([
        'questionRadio',
        'questionSelect',
        'radio',
        'select',
      ]);
      const multiChoiceTypes = new Set(['questionCheckbox', 'checkbox']);

      const questionData: any = {
        id: component.fe_id,
        title: component.title,
        type: component.type,
        options: component.props?.options || [],
        answers: [],
      };

      // 收集该题目的所有回答
      for (const answer of answers) {
        // 检查 answerList 结构
        if (answer.answerList && Array.isArray(answer.answerList)) {
          // 处理标准 answerList 结构
          const answerItem = answer.answerList.find((item: any) => {
            const curComponentId =
              item.componentFeId ||
              item.fe_id ||
              item.componentId ||
              item.id ||
              '';
            return curComponentId === component.fe_id;
          });
          if (answerItem) {
            let value = answerItem.value;
            if (!Array.isArray(value)) {
              value = [value];
            }

            // 脱敏处理
            if (
              textTypes.has(component.type) &&
              Array.isArray(value) &&
              value.length > 0 &&
              typeof value[0] === 'string'
            ) {
              value = [this.desensitizeText(value[0])];
            }

            questionData.answers.push(value);
          }
        } else {
          // 处理直接键值对结构
          const answerValue = answer[component.fe_id];
          if (answerValue !== undefined) {
            let value = answerValue;

            // 确保 value 是数组格式
            if (!Array.isArray(value)) {
              value = [value];
            }

            // 脱敏处理
            if (
              textTypes.has(component.type) &&
              value.length > 0 &&
              typeof value[0] === 'string'
            ) {
              value = [this.desensitizeText(value[0])];
            }

            questionData.answers.push(value);
          }
        }
      }

      // 统计选项分布
      if (
        (singleChoiceTypes.has(component.type) ||
          multiChoiceTypes.has(component.type)) &&
        component.props?.options &&
        Array.isArray(component.props.options)
      ) {
        questionData.optionStats = component.props.options.map(
          (option: any) => ({
            label: option.label,
            value: option.value,
            count: questionData.answers.filter(
              (v: any) =>
                (multiChoiceTypes.has(component.type) &&
                  Array.isArray(v) &&
                  v.includes(option.value)) ||
                (singleChoiceTypes.has(component.type) &&
                  Array.isArray(v) &&
                  v[0] === option.value),
            ).length,
          }),
        );
      }

      aggregated.questions.push(questionData);
    }

    return aggregated;
  }

  // 脱敏处理
  private desensitizeText(text: string): string {
    // 简单脱敏：替换邮箱、手机号等
    text = text.replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '[邮箱]');
    text = text.replace(/\b1[3-9]\d{9}\b/g, '[手机号]');
    text = text.replace(/\b\d{18}\b/g, '[身份证]');
    return text;
  }

  // 构建分析 prompt
  private buildPrompt(aggregatedData: any): string {
    const promptData = this.buildPromptData(aggregatedData);

    return `请基于以下问卷数据生成一份结构化的 AI 分析报告：

问卷信息：
- 标题：${aggregatedData.questionTitle}
- 题目数量：${aggregatedData.questionCount}
- 答卷数量：${aggregatedData.answerCount}

数据详情：
${JSON.stringify(promptData, null, 2)}

报告要求：
1. 必须返回 JSON 格式，不要包含 Markdown
2. 报告应包含：执行摘要、关键发现、样本概览、题目洞察、风险提示、行动建议
3. 每条关键发现必须附带依据（题目 ID）
4. 结论仅基于输入数据，不得臆测
5. 若样本不足，必须输出风险提示

输出格式示例：
{
  "summary": {
    "headline": "执行摘要标题",
    "brief": "执行摘要内容"
  },
  "highlights": [
    {
      "title": "关键发现 1",
      "detail": "发现详情",
      "evidenceQuestionIds": ["q1"]
    }
  ],
  "sampleOverview": {
    "totalAnswers": 100,
    "validAnswers": 100,
    "textCoverage": 80
  },
  "questionInsights": [
    {
      "questionId": "q1",
      "questionTitle": "问题标题",
      "questionType": "radio",
      "finding": "发现内容",
      "evidence": "依据内容",
      "chartHint": "图表提示"
    }
  ],
  "risks": ["风险 1", "风险 2"],
  "recommendations": ["建议 1", "建议 2"],
  "confidenceNotes": ["置信度说明"]
}`;
  }

  private buildPromptData(aggregatedData: any): any {
    const textTypes = new Set(['questionInput', 'questionTextarea', 'text']);

    return {
      questionTitle: aggregatedData.questionTitle,
      questionCount: aggregatedData.questionCount,
      answerCount: aggregatedData.answerCount,
      questions: (aggregatedData.questions || []).map((q: any) => {
        const sampleAnswers = (q.answers || []).slice(0, 20).map((ans: any) => {
          if (!Array.isArray(ans)) return ans;
          if (!textTypes.has(q.type)) return ans;

          return ans.map((item: any) => {
            if (typeof item !== 'string') return item;
            return item.length > 80 ? `${item.slice(0, 80)}...` : item;
          });
        });

        return {
          id: q.id,
          title: q.title,
          type: q.type,
          answerCount: Array.isArray(q.answers) ? q.answers.length : 0,
          optionStats: q.optionStats || [],
          sampleAnswers,
        };
      }),
    };
  }

  // 解析 AI 输出
  private parseAIResponse(response: any, aggregatedData?: any): any {
    const rawContent = this.extractAIContent(response);

    const parsed = this.tryParseJsonObject(rawContent);
    if (parsed) {
      return this.normalizeReport(parsed);
    }

    // 解析失败时降级，避免前端直接报错
    return this.buildFallbackReport(aggregatedData, rawContent);
  }

  private extractAIContent(response: any): string {
    const content = response?.choices?.[0]?.message?.content;
    if (typeof content === 'string') return content;

    // 兼容部分 OpenAI-compatible 返回数组块内容
    if (Array.isArray(content)) {
      return content
        .map((item: any) => {
          if (typeof item === 'string') return item;
          if (typeof item?.text === 'string') return item.text;
          return '';
        })
        .join('')
        .trim();
    }

    return '';
  }

  private tryParseJsonObject(raw: string): Record<string, any> | null {
    const base = (raw || '').replace(/\uFEFF/g, '').trim();
    if (!base) return null;

    const candidates: string[] = [];
    candidates.push(base);

    const noFence = base
      .replace(/```json/gi, '```')
      .replace(/```/g, '')
      .trim();
    if (noFence && noFence !== base) candidates.push(noFence);

    const fencedMatch = base.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
      candidates.push(fencedMatch[1].trim());
    }

    const firstJsonBlock = this.extractFirstJsonObject(noFence || base);
    if (firstJsonBlock) candidates.push(firstJsonBlock);

    for (const candidate of candidates) {
      const parsed = this.parseAsObject(candidate);
      if (parsed) return parsed;
    }

    return null;
  }

  private extractFirstJsonObject(text: string): string | null {
    const start = text.indexOf('{');
    if (start < 0) return null;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < text.length; i++) {
      const ch = text[i];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === '"') {
          inString = false;
        }
        continue;
      }

      if (ch === '"') {
        inString = true;
        continue;
      }
      if (ch === '{') depth++;
      if (ch === '}') {
        depth--;
        if (depth === 0) {
          return text.slice(start, i + 1);
        }
      }
    }

    return null;
  }

  private parseAsObject(jsonText: string): Record<string, any> | null {
    const trimmed = (jsonText || '').trim();
    if (!trimmed) return null;

    const attempts = [trimmed, trimmed.replace(/,\s*([}\]])/g, '$1')];

    for (const text of attempts) {
      try {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, any>;
        }
      } catch {
        // continue
      }
    }

    return null;
  }

  private normalizeReport(report: Record<string, any>): any {
    const source =
      report.report && typeof report.report === 'object'
        ? report.report
        : report;

    return {
      summary: source.summary || { headline: '', brief: '' },
      highlights: Array.isArray(source.highlights) ? source.highlights : [],
      sampleOverview: source.sampleOverview || {
        totalAnswers: 0,
        validAnswers: 0,
        textCoverage: 0,
      },
      questionInsights: Array.isArray(source.questionInsights)
        ? source.questionInsights
        : [],
      risks: Array.isArray(source.risks) ? source.risks : [],
      recommendations: Array.isArray(source.recommendations)
        ? source.recommendations
        : [],
      confidenceNotes: Array.isArray(source.confidenceNotes)
        ? source.confidenceNotes
        : [],
    };
  }

  private buildFallbackReport(aggregatedData: any, rawContent: string): any {
    const totalAnswers = aggregatedData?.answerCount || 0;
    const questionCount = aggregatedData?.questionCount || 0;

    return {
      summary: {
        headline: 'AI 报告已降级生成',
        brief:
          '本次 AI 返回内容不是标准 JSON，系统已自动降级为基础统计报告。建议稍后重试或切换 quick 模式。',
      },
      highlights: [
        {
          title: '基础样本统计',
          detail: `当前共 ${totalAnswers} 份答卷，覆盖 ${questionCount} 道题。`,
          evidenceQuestionIds: [],
        },
      ],
      sampleOverview: {
        totalAnswers,
        validAnswers: totalAnswers,
        textCoverage: 0,
      },
      questionInsights: [],
      risks: ['AI 原始返回不是标准 JSON，结果已降级。'],
      recommendations: [
        '稍后重试生成',
        '优先使用 quick 模式',
        '必要时缩小 maxAnswers',
      ],
      confidenceNotes: rawContent
        ? [`原始输出长度：${rawContent.length}`]
        : ['未获取到可解析的 AI 输出'],
    };
  }
}
