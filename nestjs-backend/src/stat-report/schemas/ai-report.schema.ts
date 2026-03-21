import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AIReportDocument = AIReport & Document;

@Schema({
  timestamps: true,
  collection: 'ai_analysis_reports',
})
export class AIReport {
  @Prop({ required: true })
  questionId: string;

  @Prop({ required: true })
  questionTitle: string;

  @Prop({ required: true, enum: ['pending', 'processing', 'succeeded', 'failed'] })
  status: string;

  @Prop({ required: true })
  answerCount: number;

  @Prop({ required: true })
  validAnswerCount: number;

  @Prop({
    type: {
      mode: String,
      timeRange: String,
      includeTextAnswers: Boolean,
      maxAnswers: Number,
    },
    required: true,
  })
  filters: {
    mode: 'quick' | 'standard' | 'deep';
    timeRange: 'all' | '7d' | '30d';
    includeTextAnswers: boolean;
    maxAnswers: number;
  };

  @Prop({
    type: {
      summary: {
        headline: String,
        brief: String,
      },
      highlights: [
        {
          title: String,
          detail: String,
          evidenceQuestionIds: [String],
        },
      ],
      sampleOverview: {
        totalAnswers: Number,
        validAnswers: Number,
        textCoverage: Number,
      },
      questionInsights: [
        {
          questionId: String,
          questionTitle: String,
          questionType: String,
          finding: String,
          evidence: String,
          chartHint: String,
        },
      ],
      risks: [String],
      recommendations: [String],
      confidenceNotes: [String],
    },
    required: true,
  })
  report: {
    summary: {
      headline: string;
      brief: string;
    };
    highlights: Array<{
      title: string;
      detail: string;
      evidenceQuestionIds: string[];
    }>;
    sampleOverview: {
      totalAnswers: number;
      validAnswers: number;
      textCoverage: number;
    };
    questionInsights: Array<{
      questionId: string;
      questionTitle: string;
      questionType: string;
      finding: string;
      evidence: string;
      chartHint?: string;
    }>;
    risks: string[];
    recommendations: string[];
    confidenceNotes: string[];
  };

  @Prop({
    type: {
      provider: String,
      model: String,
      temperature: Number,
      generatedAt: Date,
    },
    required: true,
  })
  modelInfo: {
    provider: string;
    model: string;
    temperature: number;
    generatedAt: Date;
  };

  @Prop()
  errorMessage?: string;

  @Prop({ required: true })
  createdBy: string;
}

export const AIReportSchema = SchemaFactory.createForClass(AIReport);

// 添加索引
AIReportSchema.index({ questionId: 1, createdAt: -1 });
AIReportSchema.index({ questionId: 1, status: 1, createdAt: -1 });
