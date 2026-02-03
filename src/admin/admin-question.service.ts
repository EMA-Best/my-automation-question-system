import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import {
  Question,
  type QuestionDocument,
} from '../question/schemas/question.schema';
import { User, type UserDocument } from '../user/schemas/user.schema';
import { Answer, type AnswerDocument } from '../answer/schemas/answer.schema';
import {
  QuestionReview,
  type QuestionReviewDocument,
} from '../review/schemas/question-review.schema';

export type AdminQuestionListItem = {
  _id: unknown;
  title: string;
  author: string;
  isPublished: boolean;
  isDeleted: boolean;
  auditStatus: string;
  auditReason?: string;
  auditUpdatedAt?: Date | null;
  featured?: boolean;
  pinned?: boolean;
  pinnedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  owner?: {
    username: string;
    nickname: string;
  };
};

export type AdminDeletedQuestionListItem = {
  _id: unknown;
  id: string;
  title: string;
  author: string;
  isPublished: boolean;
  pinned?: boolean;
  featured?: boolean;
  answerCount: number;
  createdAt?: Date;
  deletedAt?: Date | null;
  deleteReason?: string;
  owner?: {
    username: string;
    nickname: string;
  };
  deletedBy?: {
    username: string;
    nickname: string;
  };
};

@Injectable()
export class AdminQuestionService {
  constructor(
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Answer.name)
    private readonly answerModel: Model<AnswerDocument>,
    @InjectModel(QuestionReview.name)
    private readonly questionReviewModel: Model<QuestionReviewDocument>,
  ) {}

  private escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async listDeleted(query: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    ownerKeyword?: string;
    deletedByKeyword?: string;
    deleteReasonKeyword?: string;
    deletedAtStart?: string;
    deletedAtEnd?: string;
  }): Promise<{
    list: AdminDeletedQuestionListItem[];
    count: number;
    page: number;
    pageSize: number;
  }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 10;

    const baseMatch: Record<string, unknown> = {
      isDeleted: true,
    };

    if (query.deletedAtStart || query.deletedAtEnd) {
      const deletedAt: Record<string, unknown> = {};
      if (query.deletedAtStart) {
        const d = new Date(query.deletedAtStart);
        if (!Number.isNaN(d.getTime())) deletedAt.$gte = d;
      }
      if (query.deletedAtEnd) {
        const d = new Date(query.deletedAtEnd);
        if (!Number.isNaN(d.getTime())) deletedAt.$lte = d;
      }
      if (Object.keys(deletedAt).length > 0) baseMatch.deletedAt = deletedAt;
    }

    const buildRegex = (raw?: string) => {
      const keyword = typeof raw === 'string' ? raw.trim() : '';
      if (!keyword) return null;
      return new RegExp(this.escapeRegex(keyword), 'i');
    };

    const keywordRegex = buildRegex(query.keyword);
    const ownerRegex = buildRegex(query.ownerKeyword);
    const deletedByRegex = buildRegex(query.deletedByKeyword);
    const deleteReasonRegex = buildRegex(query.deleteReasonKeyword);

    const keyword =
      typeof query.keyword === 'string' ? query.keyword.trim() : '';

    const pipeline: mongoose.PipelineStage[] = [
      { $match: baseMatch },
      {
        $lookup: {
          from: 'users',
          let: { author: '$author' },
          pipeline: [
            { $match: { $expr: { $eq: ['$username', '$$author'] } } },
            { $project: { _id: 0, username: 1, nickname: 1 } },
          ],
          as: 'owner',
        },
      },
      { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          let: { deletedBy: '$deletedBy' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$username', '$$deletedBy'] },
                    { $eq: [{ $toString: '$_id' }, '$$deletedBy'] },
                  ],
                },
              },
            },
            { $project: { _id: 0, username: 1, nickname: 1 } },
          ],
          as: 'deletedByUser',
        },
      },
      { $unwind: { path: '$deletedByUser', preserveNullAndEmptyArrays: true } },
    ];

    if (keywordRegex) {
      const or: Record<string, unknown>[] = [{ title: keywordRegex }];
      if (mongoose.Types.ObjectId.isValid(keyword)) {
        or.push({ _id: new mongoose.Types.ObjectId(keyword) });
      }
      pipeline.push({ $match: { $or: or } });
    }

    if (ownerRegex) {
      pipeline.push({
        $match: {
          author: ownerRegex,
        },
      });
    }

    if (deletedByRegex) {
      pipeline.push({
        $match: {
          $or: [
            { deletedBy: deletedByRegex },
            { 'deletedByUser.username': deletedByRegex },
            { 'deletedByUser.nickname': deletedByRegex },
          ],
        },
      });
    }

    if (deleteReasonRegex) {
      pipeline.push({ $match: { deleteReason: deleteReasonRegex } });
    }

    // 统计答卷数（answers.questionId 为 string）
    pipeline.push({
      $lookup: {
        from: 'answers',
        let: { qid: { $toString: '$_id' } },
        pipeline: [
          { $match: { $expr: { $eq: ['$questionId', '$$qid'] } } },
          { $count: 'count' },
        ],
        as: 'answerAgg',
      },
    });
    pipeline.push({
      $addFields: {
        answerCount: {
          $ifNull: [{ $arrayElemAt: ['$answerAgg.count', 0] }, 0],
        },
      },
    });
    pipeline.push({ $project: { answerAgg: 0 } });

    pipeline.push({
      $sort: {
        deletedAt: -1,
        _id: -1,
      },
    });

    pipeline.push({
      $facet: {
        list: [
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
          {
            $project: {
              id: { $toString: '$_id' },
              title: 1,
              author: 1,
              isPublished: 1,
              pinned: 1,
              featured: 1,
              answerCount: 1,
              createdAt: 1,
              deletedAt: 1,
              deleteReason: 1,
              owner: 1,
              deletedBy: '$deletedByUser',
            },
          },
        ],
        count: [{ $count: 'count' }],
      },
    });

    type AggregateResult = {
      list: AdminDeletedQuestionListItem[];
      count: { count: number }[];
    };

    const result =
      await this.questionModel.aggregate<AggregateResult>(pipeline);

    const first = result[0] ?? { list: [], count: [] };

    return {
      list: first.list,
      count: first.count[0]?.count ?? 0,
      page,
      pageSize,
    };
  }

  async list(query: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    author?: string;
    isPublished?: string;
    isDeleted?: string;
    auditStatus?: string;
    featured?: string;
    pinned?: string;
    createdAtStart?: string;
    createdAtEnd?: string;
  }) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 10;

    const baseMatch: Record<string, unknown> = {};

    // 默认只返回未删除数据；回收站页可显式传 isDeleted=true
    if (query.isDeleted === 'true') baseMatch.isDeleted = true;
    else if (query.isDeleted === 'false') baseMatch.isDeleted = false;
    else baseMatch.isDeleted = false;

    if (typeof query.author === 'string' && query.author.trim()) {
      baseMatch.author = query.author.trim();
    }

    if (query.isPublished === 'true') baseMatch.isPublished = true;
    if (query.isPublished === 'false') baseMatch.isPublished = false;

    if (
      typeof query.auditStatus === 'string' &&
      ['Draft', 'PendingReview', 'Approved', 'Rejected'].includes(
        query.auditStatus,
      )
    ) {
      baseMatch.auditStatus = query.auditStatus;
    }

    if (query.featured === 'true') baseMatch.featured = true;
    if (query.featured === 'false') baseMatch.featured = false;

    if (query.pinned === 'true') baseMatch.pinned = true;
    if (query.pinned === 'false') baseMatch.pinned = false;

    if (query.createdAtStart || query.createdAtEnd) {
      const createdAt: Record<string, unknown> = {};
      if (query.createdAtStart) {
        const d = new Date(query.createdAtStart);
        if (!Number.isNaN(d.getTime())) createdAt.$gte = d;
      }
      if (query.createdAtEnd) {
        const d = new Date(query.createdAtEnd);
        if (!Number.isNaN(d.getTime())) createdAt.$lte = d;
      }
      if (Object.keys(createdAt).length > 0) baseMatch.createdAt = createdAt;
    }

    const keyword =
      typeof query.keyword === 'string' ? query.keyword.trim() : '';
    const regex = keyword
      ? new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      : null;

    const pipeline: mongoose.PipelineStage[] = [
      { $match: baseMatch },
      {
        $lookup: {
          from: 'users',
          let: { author: '$author' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$username', '$$author'] },
              },
            },
            {
              $project: {
                _id: 0,
                username: 1,
                nickname: 1,
              },
            },
          ],
          as: 'owner',
        },
      },
      { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
    ];

    if (regex) {
      const or: Record<string, unknown>[] = [
        { title: regex },
        { author: regex },
        { 'owner.nickname': regex },
        { 'owner.username': regex },
      ];
      if (mongoose.Types.ObjectId.isValid(keyword)) {
        or.push({ _id: new mongoose.Types.ObjectId(keyword) });
      }
      pipeline.push({ $match: { $or: or } });
    }

    pipeline.push({
      $sort: {
        pinned: -1,
        pinnedAt: -1,
        updatedAt: -1,
        _id: -1,
      },
    });

    pipeline.push({
      $facet: {
        list: [
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize },
          {
            $project: {
              title: 1,
              author: 1,
              isPublished: 1,
              isDeleted: 1,
              auditStatus: 1,
              auditReason: 1,
              auditUpdatedAt: 1,
              featured: 1,
              pinned: 1,
              pinnedAt: 1,
              createdAt: 1,
              updatedAt: 1,
              owner: 1,
            },
          },
        ],
        count: [{ $count: 'count' }],
      },
    });

    type AggregateResult = {
      list: AdminQuestionListItem[];
      count: { count: number }[];
    };

    const result =
      await this.questionModel.aggregate<AggregateResult>(pipeline);

    const first = result[0] ?? { list: [], count: [] };

    return {
      list: first.list,
      count: first.count[0]?.count ?? 0,
      page,
      pageSize,
    };
  }

  async restore(id: string, restoredBy: string): Promise<{ ok: true }> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundException('问卷不存在');
    }

    const question = await this.questionModel.findById(id);
    if (!question) throw new NotFoundException('问卷不存在');

    if (!question.isDeleted) {
      throw new BadRequestException('问卷未删除，无需恢复');
    }

    question.isDeleted = false;
    question.restoredAt = new Date();
    question.restoredBy = restoredBy;
    await question.save();

    return { ok: true };
  }

  async softDelete(
    id: string,
    operatorId: string,
    reason: string,
  ): Promise<{ ok: true }> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundException('问卷不存在');
    }

    const question = await this.questionModel.findById(id);
    if (!question) throw new NotFoundException('问卷不存在');

    if (question.isDeleted) {
      throw new BadRequestException('问卷已在回收站');
    }

    const trimmedReason = typeof reason === 'string' ? reason.trim() : '';
    if (!trimmedReason) {
      throw new BadRequestException('reason 不能为空');
    }

    question.isDeleted = true;
    question.deletedAt = new Date();
    question.deletedBy = operatorId;
    question.deleteReason = trimmedReason;

    await question.save();

    return { ok: true };
  }

  async permanentDelete(
    id: string,
    operator: string,
  ): Promise<{
    ok: true;
    operator: string;
    deleted: { question: number; answers: number; reviews: number };
  }> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundException('问卷不存在');
    }

    const question = await this.questionModel.findById(id);
    if (!question) throw new NotFoundException('问卷不存在');

    if (!question.isDeleted) {
      throw new BadRequestException('仅支持对已删除问卷执行永久删除');
    }

    // 先删关联数据（避免残留）
    const answersRes = await this.answerModel.deleteMany({ questionId: id });
    const reviewsRes = await this.questionReviewModel.deleteMany({
      questionId: new mongoose.Types.ObjectId(id),
    });

    const questionRes = await this.questionModel.deleteOne({ _id: id });

    return {
      ok: true,
      operator,
      deleted: {
        question: questionRes.deletedCount ?? 0,
        answers: answersRes.deletedCount ?? 0,
        reviews: reviewsRes.deletedCount ?? 0,
      },
    };
  }

  async detail(id: string): Promise<Record<string, unknown>> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundException('问卷不存在');
    }

    const question = await this.questionModel
      .findById(id)
      .lean<{ author: string } & Record<string, unknown>>();
    if (!question) throw new NotFoundException('问卷不存在');

    const owner = await this.userModel
      .findOne({ username: question.author })
      .select({ username: 1, nickname: 1, _id: 0 })
      .lean<{ username: string; nickname?: string }>();

    return {
      ...question,
      owner: owner ?? null,
    };
  }

  async unpublish(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundException('问卷不存在');
    }

    const question = await this.questionModel.findById(id);
    if (!question) throw new NotFoundException('问卷不存在');

    question.isPublished = false;
    question.pinned = false;
    question.featured = false;
    question.pinnedAt = null;
    await question.save();

    return { ok: true };
  }

  async publish(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundException('问卷不存在');
    }

    const question = await this.questionModel.findById(id);
    if (!question) throw new NotFoundException('问卷不存在');

    if (question.isDeleted) {
      throw new BadRequestException('问卷已删除，无法发布');
    }

    question.isPublished = true;

    // 管理员强制发布：若未通过审核，则自动置为 Approved（避免前端展示冲突）
    if (question.auditStatus !== 'Approved') {
      question.auditStatus = 'Approved';
      question.auditReason = '';
      question.auditUpdatedAt = new Date();
    }

    await question.save();

    return { ok: true };
  }

  async feature(id: string, payload: { featured?: boolean; pinned?: boolean }) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundException('问卷不存在');
    }

    if (payload.featured == null && payload.pinned == null) {
      throw new BadRequestException('featured 或 pinned 至少传一个');
    }

    const question = await this.questionModel.findById(id);
    if (!question) throw new NotFoundException('问卷不存在');

    if (!question.isPublished) {
      throw new BadRequestException('未发布问卷不支持置顶/推荐');
    }

    if (typeof payload.featured === 'boolean') {
      question.featured = payload.featured;
    }

    if (typeof payload.pinned === 'boolean') {
      question.pinned = payload.pinned;
      question.pinnedAt = payload.pinned ? new Date() : null;
    }

    await question.save();

    return { ok: true };
  }
}
