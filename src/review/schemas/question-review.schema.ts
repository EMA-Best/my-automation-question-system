import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type QuestionReviewDocument = HydratedDocument<QuestionReview>;

@Schema({
  collection: 'question_reviews',
})
export class QuestionReview {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Question',
    index: true,
  })
  questionId: mongoose.Types.ObjectId;

  @Prop({ required: true, index: true })
  author: string;

  @Prop({ required: true, index: true })
  submitter: string;

  @Prop({ default: '' })
  reviewer?: string;

  @Prop({
    type: String,
    enum: ['PendingReview', 'Approved', 'Rejected'],
    required: true,
    index: true,
  })
  status: 'PendingReview' | 'Approved' | 'Rejected';

  @Prop({ default: '' })
  reason?: string;

  @Prop({ type: Date, required: true, index: true })
  submittedAt: Date;

  @Prop({ type: Date, default: null })
  reviewedAt?: Date | null;

  @Prop({ type: Object, default: null })
  snapshot?: Record<string, unknown> | null;
}

export const QuestionReviewSchema =
  SchemaFactory.createForClass(QuestionReview);

QuestionReviewSchema.index({ status: 1, submittedAt: -1 });
QuestionReviewSchema.index({ questionId: 1, submittedAt: -1 });
