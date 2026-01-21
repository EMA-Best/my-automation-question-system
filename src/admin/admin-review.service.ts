import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  QuestionReview,
  type QuestionReviewDocument,
} from '../review/schemas/question-review.schema';
import {
  Question,
  type QuestionDocument,
} from '../question/schemas/question.schema';

export type ReviewListItem = {
  _id: unknown;
  status: QuestionReview['status'];
  reason?: string;
  submitter: string;
  reviewer?: string;
  submittedAt: Date;
  reviewedAt?: Date | null;
  question?: {
    _id: unknown;
    title?: string;
    author?: string;
    isPublished?: boolean;
    auditStatus?: string;
    updatedAt?: Date;
    createdAt?: Date;
  };
};

type ReviewLean = {
  _id: unknown;
  status: QuestionReview['status'];
  reason?: unknown;
  submitter: unknown;
  reviewer?: unknown;
  submittedAt: unknown;
  reviewedAt?: unknown;
  questionId?: {
    _id: unknown;
    title?: unknown;
    author?: unknown;
    isPublished?: unknown;
    auditStatus?: unknown;
    updatedAt?: unknown;
    createdAt?: unknown;
  } | null;
};

@Injectable()
export class AdminReviewService {
  constructor(
    @InjectModel(QuestionReview.name)
    private readonly questionReviewModel: Model<QuestionReviewDocument>,
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
  ) {}

  async list(params: {
    status?: 'pending' | 'approved' | 'rejected';
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const pageSize =
      params.pageSize && params.pageSize > 0 ? params.pageSize : 10;

    const statusMap: Record<string, QuestionReview['status']> = {
      pending: 'PendingReview',
      approved: 'Approved',
      rejected: 'Rejected',
    };

    const baseFilter: Record<string, unknown> = {};
    if (params.status) {
      baseFilter.status = statusMap[params.status] ?? 'PendingReview';
    }

    const keyword =
      typeof params.keyword === 'string' ? params.keyword.trim() : '';
    let filter: Record<string, unknown> = baseFilter;
    if (keyword) {
      const escapeRegExp = (value: string) =>
        value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const keywordRegex = new RegExp(escapeRegExp(keyword), 'i');

      const questionIds = await this.questionModel.distinct('_id', {
        $or: [{ title: keywordRegex }, { author: keywordRegex }],
      });

      const or: Record<string, unknown>[] = [
        { submitter: keywordRegex },
        { reviewer: keywordRegex },
      ];

      if (Array.isArray(questionIds) && questionIds.length > 0) {
        or.push({ questionId: { $in: questionIds } });
      }

      filter =
        Object.keys(baseFilter).length > 0
          ? { $and: [baseFilter, { $or: or }] }
          : { $or: or };
    }

    const [list, count] = await Promise.all([
      this.questionReviewModel
        .find(filter)
        .sort({ submittedAt: -1, _id: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate({
          path: 'questionId',
          select: 'title author isPublished auditStatus updatedAt createdAt',
        })
        .lean<ReviewLean[]>(),
      this.questionReviewModel.countDocuments(filter),
    ]);

    const mapped: ReviewListItem[] = list.map((r) => {
      const submitter = typeof r.submitter === 'string' ? r.submitter : '';
      const reviewer = typeof r.reviewer === 'string' ? r.reviewer : '';

      const submittedAt =
        r.submittedAt instanceof Date ? r.submittedAt : new Date(0);
      const reviewedAt = r.reviewedAt instanceof Date ? r.reviewedAt : null;

      const q = r.questionId;
      const question = q
        ? {
            _id: q._id,
            title: typeof q.title === 'string' ? q.title : undefined,
            author: typeof q.author === 'string' ? q.author : undefined,
            isPublished:
              typeof q.isPublished === 'boolean' ? q.isPublished : undefined,
            auditStatus:
              typeof q.auditStatus === 'string' ? q.auditStatus : undefined,
            updatedAt: q.updatedAt instanceof Date ? q.updatedAt : undefined,
            createdAt: q.createdAt instanceof Date ? q.createdAt : undefined,
          }
        : undefined;

      return {
        _id: r._id,
        status: r.status,
        reason: typeof r.reason === 'string' ? r.reason : undefined,
        submitter,
        reviewer: reviewer || undefined,
        submittedAt,
        reviewedAt,
        question,
      };
    });

    return { list: mapped, count, page, pageSize };
  }

  async approve(questionId: string, reviewer: string, autoPublish?: boolean) {
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      throw new NotFoundException('问卷不存在');
    }

    const question = await this.questionModel.findById(questionId);
    if (!question) throw new NotFoundException('问卷不存在');

    const currentStatus = question.auditStatus ?? 'Draft';
    if (currentStatus !== 'PendingReview') {
      throw new BadRequestException('问卷不在待审核状态');
    }

    question.auditStatus = 'Approved';
    question.auditReason = '';
    question.auditUpdatedAt = new Date();
    if (autoPublish === true) {
      question.isPublished = true;
    }
    await question.save();

    const updated = await this.questionReviewModel
      .findOneAndUpdate(
        { questionId: question._id, status: 'PendingReview' },
        {
          $set: {
            status: 'Approved',
            reviewer,
            reason: '',
            reviewedAt: new Date(),
          },
        },
        { sort: { submittedAt: -1, _id: -1 }, new: true },
      )
      .lean();

    if (!updated) {
      await this.questionReviewModel.create({
        questionId: question._id,
        author: question.author,
        submitter: question.author,
        reviewer,
        status: 'Approved',
        reason: '',
        submittedAt: new Date(),
        reviewedAt: new Date(),
      });
    }

    return { ok: true };
  }

  async reject(questionId: string, reviewer: string, reason: string) {
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      throw new NotFoundException('问卷不存在');
    }

    const question = await this.questionModel.findById(questionId);
    if (!question) throw new NotFoundException('问卷不存在');

    const currentStatus = question.auditStatus ?? 'Draft';
    if (currentStatus !== 'PendingReview') {
      throw new BadRequestException('问卷不在待审核状态');
    }

    question.auditStatus = 'Rejected';
    question.auditReason = reason;
    question.auditUpdatedAt = new Date();
    await question.save();

    const updated = await this.questionReviewModel
      .findOneAndUpdate(
        { questionId: question._id, status: 'PendingReview' },
        {
          $set: {
            status: 'Rejected',
            reviewer,
            reason,
            reviewedAt: new Date(),
          },
        },
        { sort: { submittedAt: -1, _id: -1 }, new: true },
      )
      .lean();

    if (!updated) {
      await this.questionReviewModel.create({
        questionId: question._id,
        author: question.author,
        submitter: question.author,
        reviewer,
        status: 'Rejected',
        reason,
        submittedAt: new Date(),
        reviewedAt: new Date(),
      });
    }

    return { ok: true };
  }
}
