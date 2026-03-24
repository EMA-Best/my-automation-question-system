import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Question, QuestionDocument } from './schemas/question.schema';
import mongoose, { Model } from 'mongoose';
import { nanoid } from 'nanoid';
import type { QuestionDto } from './dto/question.dto';
import { AIService, type AIGenerateStreamHandlers } from '../ai/ai.service';
import { Answer, type AnswerDocument } from '../answer/schemas/answer.schema';
import {
  QuestionReview,
  type QuestionReviewDocument,
} from '../review/schemas/question-review.schema';

// 仅暴露我们关心且可移植的 update 结果结构（避免直接泄漏 mongodb 驱动类型）
export type QuestionUpdateResult = {
  acknowledged: boolean;
  matchedCount: number;
  modifiedCount: number;
  upsertedCount: number;
  upsertedId?: unknown;
};

// 聚合查询返回的结构（非 mongoose document）
export type QuestionWithAnswerCount = {
  _id: unknown;
  title: string;
  desc?: string;
  author: string;
  js?: string;
  css?: string;
  isPublished?: boolean;
  isStar?: boolean;
  isDeleted?: boolean;
  componentList?: Question['componentList'];
  answerCount: number;
};

export type FeaturedQuestionItem = {
  id: string;
  title: string;
  desc: string;
  featured: boolean;
  pinned: boolean;
  pinnedAt: Date | null;
  questionCount: number;
  answerCount: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type QuestionPreviewResponse = {
  id: string;
  title: string;
  desc: string;
  componentList: Question['componentList'];
  featured: boolean;
  pinned: boolean;
  pinnedAt: Date | null;
  questionCount: number;
  answerCount: number;
  createdAt?: Date;
  updatedAt?: Date;
};

type FeaturedQuestionLeanDoc = {
  _id: mongoose.Types.ObjectId;
  title?: string;
  desc?: string;
  featured?: boolean;
  pinned?: boolean;
  pinnedAt?: Date | null;
  componentList?: Question['componentList'];
  createdAt?: Date;
  updatedAt?: Date;
};

// 查询参数类型
export interface FindAllListParams {
  keyword?: string;
  pageNum?: number;
  pageSize?: number;
  isDeleted?: boolean;
  isStar?: boolean | null;
  author?: string;
}

// 统计参数类型
export interface CountAllParams {
  keyword?: string;
  isDeleted?: boolean;
  author?: string;
  isStar?: boolean | null;
}

@Injectable()
export class QuestionService {
  constructor(
    // 依赖注入问题模型
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
    @InjectModel(QuestionReview.name)
    private readonly questionReviewModel: Model<QuestionReviewDocument>,
    @InjectModel(Answer.name)
    private readonly answerModel: Model<AnswerDocument>,
    // 依赖注入 AI 服务
    private readonly aiService: AIService,
  ) {}

  /**
   * 统计题目数量（用于首页/列表的“题目数”展示）
   *
   * 口径说明：
   * - componentList 中既有真正的题目组件，也可能有“问卷信息/说明”类组件
   * - 约定：type === 'questionInfo' 仅做展示说明，不计入题目数量
   * - 约定：isHidden === true 的组件不展示给用户，也不计入题目数量
   */
  private countQuestions(componentList: Question['componentList'] | undefined) {
    const list = Array.isArray(componentList) ? componentList : [];

    // 约定：questionInfo questionParagraph questionTitle属于说明/标题，不计入题目数；隐藏组件也不计入
    return list.filter(
      (c) =>
        c &&
        c.type !== 'questionInfo' &&
        c.type !== 'questionParagraph' &&
        c.type !== 'questionTitle' &&
        !c.isHidden,
    ).length;
  }

  /**
   * 批量统计答卷数量
   *
   * 为什么要做成“批量 + 聚合”的形式：
   * - 如果列表里有 N 个问卷，逐个 countDocuments 会产生 N 次 DB 查询（N+1 问题）
   * - 使用 aggregate + group 可以一次性拿到所有 questionId 的答卷数量
   *
   * 数据模型说明：
   * - Answer.questionId 在本项目里存的是字符串（通常等于 Question._id.toString()）
   */
  private async getAnswerCountMap(
    questionIds: string[],
  ): Promise<Map<string, number>> {
    const ids = questionIds
      .map((id) => (typeof id === 'string' ? id.trim() : ''))
      .filter(Boolean);

    const map = new Map<string, number>();
    if (ids.length === 0) return map;

    // Answer.questionId 是字符串，存储的是 Question._id 的 toString()
    const rows = await this.answerModel.aggregate<{
      _id: string;
      count: number;
    }>([
      { $match: { questionId: { $in: ids } } },
      { $group: { _id: '$questionId', count: { $sum: 1 } } },
    ]);

    rows.forEach((r) => {
      map.set(r._id, typeof r.count === 'number' ? r.count : 0);
    });

    return map;
  }

  /**
   * 获取热门问卷列表（置顶/推荐）
   *
   * 公开接口约束：仅返回“未删除 + 已发布 +（置顶或推荐）”的问卷。
   * - isDeleted=false：回收站数据不应出现在首页
   * - isPublished=true：草稿不应对外可见
   * - featured=true 或 pinned=true：只有运营标记过的才算“热门/推荐”
   *
   * 排序规则（与管理端常见习惯一致）：
   * - pinned 在最前
   * - pinnedAt 越新越靠前
   * - featured 次之
   * - updatedAt/_id 兜底
   */
  async getFeaturedQuestions(): Promise<FeaturedQuestionItem[]> {
    let questions = await this.questionModel
      .find<FeaturedQuestionLeanDoc>({
        isDeleted: false,
        isPublished: true,
        $or: [{ featured: true }, { pinned: true }],
      })
      .select({
        title: 1,
        desc: 1,
        featured: 1,
        pinned: 1,
        pinnedAt: 1,
        componentList: 1,
      })
      .sort({ pinned: -1, pinnedAt: -1, featured: -1, updatedAt: -1, _id: -1 })
      .lean();

    // Fallback: if no curated items are configured yet, show latest published questionnaires.
    if (questions.length === 0) {
      questions = await this.questionModel
        .find<FeaturedQuestionLeanDoc>({
          isDeleted: false,
          isPublished: true,
        })
        .select({
          title: 1,
          desc: 1,
          featured: 1,
          pinned: 1,
          pinnedAt: 1,
          componentList: 1,
        })
        .sort({ updatedAt: -1, _id: -1 })
        .limit(8)
        .lean();
    }

    // 批量拿到这些问卷的答卷数量
    const ids = questions.map((q) => String(q._id));
    const answerCountMap = await this.getAnswerCountMap(ids);

    return questions.map((q) => {
      const id = String(q._id);
      return {
        id,
        title: q.title ?? '',
        desc: q.desc ?? '',
        featured: Boolean(q.featured),
        pinned: Boolean(q.pinned),
        pinnedAt: q.pinnedAt ?? null,
        // 题目数：按约定口径计算（排除说明类组件、隐藏组件）
        questionCount: this.countQuestions(q.componentList),
        // 答卷数：来自 answers 聚合统计
        answerCount: answerCountMap.get(id) ?? 0,
      };
    });
  }

  /**
   * 获取问卷预览信息（公开）
   *
   * 仅允许访问已发布且未删除的问卷。
   * 这与 findOnePublic 的逻辑不同：
   * - findOnePublic 允许作者访问未发布问卷（用于填写/预览草稿）
   * - preview 是给“公开预览页”用的，必须严格只返回已发布
   */
  async getQuestionPreview(id: string): Promise<QuestionPreviewResponse> {
    // 先校验 ObjectId，避免 mongoose CastError
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundException('问卷不存在');
    }

    const question = await this.questionModel
      .findOne<FeaturedQuestionLeanDoc>({
        _id: id,
        isDeleted: false,
        isPublished: true,
      })
      .select({
        title: 1,
        desc: 1,
        componentList: 1,
        featured: 1,
        pinned: 1,
        pinnedAt: 1,
      })
      .lean();

    if (!question) {
      throw new NotFoundException('问卷不存在');
    }

    const qid = String(question._id);
    // 统计该问卷的答卷数量（仍复用批量聚合方法，便于后续扩展）
    const answerCountMap = await this.getAnswerCountMap([qid]);

    return {
      id: qid,
      title: question.title ?? '',
      desc: question.desc ?? '',
      componentList: question.componentList ?? [],
      featured: Boolean(question.featured),
      pinned: Boolean(question.pinned),
      pinnedAt: question.pinnedAt ?? null,
      questionCount: this.countQuestions(question.componentList),
      answerCount: answerCountMap.get(qid) ?? 0,
    };
  }

  async create(username: string): Promise<QuestionDocument> {
    const question = new this.questionModel({
      title: '问卷标题' + Date.now(),
      desc: '问卷描述',
      author: username,
      auditStatus: 'Draft',
      auditUpdatedAt: new Date(),
      componentList: [
        {
          fe_id: nanoid(),
          type: 'questionInfo',
          title: '问卷信息',
          props: { title: '问卷标题', desc: '问卷描述...' },
        },
      ],
    });
    return await question.save();
  }

  async submitReview(id: string, username: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundException('问卷不存在');
    }

    const question = await this.questionModel.findOne({
      _id: id,
      author: username,
    });
    if (!question) {
      throw new NotFoundException('问卷不存在');
    }

    if (question.isDeleted) {
      throw new BadRequestException('问卷已删除，无法提交审核');
    }

    if (question.isPublished) {
      throw new BadRequestException('已发布问卷不支持提交审核');
    }

    const currentStatus = question.auditStatus ?? 'Draft';
    if (currentStatus === 'PendingReview') {
      throw new BadRequestException('问卷已在审核中');
    }

    question.auditStatus = 'PendingReview';
    question.auditReason = '';
    question.auditUpdatedAt = new Date();
    await question.save();

    const review = new this.questionReviewModel({
      questionId: question._id,
      author: question.author,
      submitter: username,
      status: 'PendingReview',
      reason: '',
      submittedAt: new Date(),
      reviewedAt: null,
    });

    const saved = await review.save();

    return {
      ok: true,
      reviewId: saved._id,
    };
  }

  async aiGenerateQuestionStream(
    prompt: string,
    handlers: AIGenerateStreamHandlers,
    signal?: AbortSignal,
  ): Promise<void> {
    return await this.aiService.generateQuestionStream(
      { prompt },
      handlers,
      signal,
    );
  }

  async findOne(id: string): Promise<QuestionDocument | null> {
    // 在查询前校验 ObjectId，避免 CastError
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await this.questionModel.findById(id);
  }

  async findOnePublic(
    id: string,
    username?: string,
  ): Promise<QuestionDocument> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundException('问卷不存在');
    }

    const question = await this.questionModel.findById(id);
    if (!question) {
      throw new NotFoundException('问卷不存在');
    }

    // 已发布：任何人可访问
    if (question.isPublished) return question;

    // 未发布：仅作者可访问
    if (username && question.author === username) return question;

    throw new ForbiddenException('无权访问未发布问卷');
  }

  async delete(id: string, author: string): Promise<QuestionDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundException('问卷不存在');
    }

    // 软删除：写入删除审计字段，供管理员回收站展示
    return await this.questionModel.findOneAndUpdate(
      { _id: id, author },
      {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: author,
        deleteReason: '',
      },
      { new: true },
    );
  }

  async update(
    id: string,
    questionDto: unknown,
    author: string,
  ): Promise<QuestionUpdateResult> {
    const updatePayload: QuestionDto = {};
    const auditPayload: Record<string, unknown> = {};

    if (typeof questionDto !== 'object' || questionDto == null) {
      const res = await this.questionModel.updateOne(
        {
          _id: id,
          author,
        },
        updatePayload,
      );

      return {
        acknowledged: res.acknowledged,
        matchedCount: res.matchedCount,
        modifiedCount: res.modifiedCount,
        upsertedCount: res.upsertedCount,
        upsertedId: res.upsertedId,
      };
    }

    const record = questionDto as Record<string, unknown>;

    // 字段白名单：避免客户端传 author 等敏感字段
    if (typeof record.title === 'string') updatePayload.title = record.title;
    if (typeof record.desc === 'string') updatePayload.desc = record.desc;
    if (typeof record.js === 'string') updatePayload.js = record.js;
    if (typeof record.css === 'string') updatePayload.css = record.css;
    if (typeof record.isPublished === 'boolean') {
      updatePayload.isPublished = record.isPublished;
    }
    if (typeof record.isStar === 'boolean') {
      updatePayload.isStar = record.isStar;
    }
    if (typeof record.isDeleted === 'boolean') {
      updatePayload.isDeleted = record.isDeleted;
      if (record.isDeleted) {
        auditPayload.deletedAt = new Date();
        auditPayload.deletedBy = author;
        if (typeof record.deleteReason === 'string') {
          auditPayload.deleteReason = record.deleteReason;
        } else {
          auditPayload.deleteReason = '';
        }
      } else {
        auditPayload.restoredAt = new Date();
        auditPayload.restoredBy = author;
      }
    }

    if (record.componentList != null) {
      updatePayload.componentList = this.sanitizeComponentList(
        record.componentList,
      );
    }

    const res = await this.questionModel.updateOne(
      {
        _id: id,
        author,
      },
      { ...updatePayload, ...auditPayload },
    );

    return {
      acknowledged: res.acknowledged,
      matchedCount: res.matchedCount,
      modifiedCount: res.modifiedCount,
      upsertedCount: res.upsertedCount,
      upsertedId: res.upsertedId,
    };
  }

  private sanitizeComponentList(input: unknown): Question['componentList'] {
    if (!Array.isArray(input)) {
      throw new BadRequestException('componentList 必须是数组');
    }

    const usedIds = new Set<string>();

    return input
      .map((raw) => {
        if (typeof raw !== 'object' || raw == null) return null;
        const record = raw as Record<string, unknown>;

        const type = typeof record.type === 'string' ? record.type : '';
        if (!type) return null;

        const title = typeof record.title === 'string' ? record.title : type;
        const props =
          typeof record.props === 'object' && record.props != null
            ? (record.props as Record<string, unknown>)
            : {};

        let fe_id = typeof record.fe_id === 'string' ? record.fe_id : '';
        if (!fe_id || usedIds.has(fe_id)) fe_id = nanoid();
        usedIds.add(fe_id);

        const isHidden =
          typeof record.isHidden === 'boolean' ? record.isHidden : false;
        const isLocked =
          typeof record.isLocked === 'boolean' ? record.isLocked : false;

        return {
          fe_id,
          type,
          title,
          isHidden,
          isLocked,
          props,
        };
      })
      .filter(Boolean) as Question['componentList'];
  }

  private normalizeImportedQuestion(raw: unknown): {
    title: string;
    desc: string;
    js: string;
    css: string;
    isPublished: boolean;
    componentList: Question['componentList'];
  } {
    if (typeof raw !== 'object' || raw == null) {
      throw new BadRequestException('导入数据必须是对象');
    }
    const record = raw as Record<string, unknown>;

    // 兼容多种形态：
    // 1) { title, desc, js, css, isPublished, componentList, schemaVersion?... }
    // 2) { pageInfo: { ... }, componentList }

    const hasComponentList = Array.isArray(record.componentList);
    const hasPageInfo =
      typeof record.pageInfo === 'object' && record.pageInfo != null;

    let title = '';
    let desc = '';
    let js = '';
    let css = '';
    let isPublished = false;
    let componentList: Question['componentList'] = [];

    if (hasComponentList && !hasPageInfo) {
      title = typeof record.title === 'string' ? record.title : '';
      desc = typeof record.desc === 'string' ? record.desc : '';
      js = typeof record.js === 'string' ? record.js : '';
      css = typeof record.css === 'string' ? record.css : '';
      isPublished =
        typeof record.isPublished === 'boolean' ? record.isPublished : false;
      componentList = this.sanitizeComponentList(record.componentList);
      return { title, desc, js, css, isPublished, componentList };
    }

    if (hasComponentList && hasPageInfo) {
      const pageInfo = record.pageInfo as Record<string, unknown>;
      title = typeof pageInfo.title === 'string' ? pageInfo.title : '';
      desc = typeof pageInfo.desc === 'string' ? pageInfo.desc : '';
      js = typeof pageInfo.js === 'string' ? pageInfo.js : '';
      css = typeof pageInfo.css === 'string' ? pageInfo.css : '';
      isPublished =
        typeof pageInfo.isPublished === 'boolean'
          ? pageInfo.isPublished
          : false;
      componentList = this.sanitizeComponentList(record.componentList);
      return { title, desc, js, css, isPublished, componentList };
    }

    throw new BadRequestException('文件内容不符合问卷格式');
  }

  async exportQuestion(id: string, author: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundException('问卷不存在');
    }

    const question = await this.questionModel.findOne({ _id: id, author });
    if (!question) throw new NotFoundException('问卷不存在');

    const {
      title = '',
      desc = '',
      js = '',
      css = '',
      isPublished = false,
      componentList = [],
    } = question;

    // 导出时剥离 mongoose 子文档的 _id 等内部字段，保证前端导入稳定
    const exportedComponentList = componentList.map((c) => ({
      fe_id: c.fe_id,
      type: c.type,
      title: c.title,
      isHidden: c.isHidden,
      isLocked: c.isLocked,
      props: c.props ?? {},
    }));

    return {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      app: 'question-server-nestjs',
      title,
      desc,
      js,
      css,
      isPublished,
      componentList: exportedComponentList,
    };
  }

  async importQuestion(
    raw: unknown,
    author: string,
  ): Promise<QuestionDocument> {
    const normalized = this.normalizeImportedQuestion(raw);

    // 出于安全：导入创建的新问卷默认不发布、不加星、不删除
    const newQuestion = new this.questionModel({
      title: normalized.title || '未命名问卷',
      desc: normalized.desc || '',
      js: normalized.js || '',
      css: normalized.css || '',
      author,
      isPublished: false,
      isStar: false,
      isDeleted: false,
      componentList: normalized.componentList,
    });

    return await newQuestion.save();
  }

  async importIntoQuestion(
    id: string,
    raw: unknown,
    author: string,
  ): Promise<QuestionUpdateResult> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundException('问卷不存在');
    }

    const question = await this.questionModel.findOne({ _id: id, author });
    if (!question) throw new NotFoundException('问卷不存在');

    const normalized = this.normalizeImportedQuestion(raw);

    // 覆盖导入仅更新编辑相关字段（含发布状态）
    const updatePayload: QuestionDto = {
      title: normalized.title || '未命名问卷',
      desc: normalized.desc || '',
      js: normalized.js || '',
      css: normalized.css || '',
      isPublished: normalized.isPublished,
      componentList: normalized.componentList,
    };

    const res = await this.questionModel.updateOne(
      {
        _id: id,
        author,
      },
      updatePayload,
    );

    return {
      acknowledged: res.acknowledged,
      matchedCount: res.matchedCount,
      modifiedCount: res.modifiedCount,
      upsertedCount: res.upsertedCount,
      upsertedId: res.upsertedId,
    };
  }

  async findAllList(
    params: FindAllListParams,
  ): Promise<QuestionWithAnswerCount[]> {
    console.log('findAllList params: ', params);

    const {
      keyword = '',
      pageNum = 1,
      pageSize = 10,
      isDeleted = false,
      isStar,
      author = '',
    } = params;

    console.log('findAllList parsed params:');
    console.log('  pageNum:', pageNum, typeof pageNum);
    console.log('  pageSize:', pageSize, typeof pageSize);
    console.log('  skip:', (pageNum - 1) * pageSize);
    console.log('  limit:', pageSize);

    const matchStage: {
      author: string;
      isDeleted: boolean;
      title?: { $regex: RegExp };
      isStar?: boolean;
    } = {
      author,
      isDeleted,
    };

    if (isStar != null) {
      matchStage.isStar = isStar;
    }

    if (keyword) {
      const reg = new RegExp(keyword, 'i');
      matchStage.title = { $regex: reg }; // 标题模糊查询
    }

    const result = await this.questionModel.aggregate<QuestionWithAnswerCount>([
      // 过滤条件
      { $match: matchStage },
      // 联合Answer表
      {
        $lookup: {
          from: 'answers', // 要联合的集合名
          let: { questionId: '$_id' }, // 将本地_id赋值给变量
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $toObjectId: '$questionId' }, // 将answer表中的questionId转换为ObjectId
                    '$$questionId', // 与本地_id变量匹配
                  ],
                },
              },
            },
          ],
          as: 'answerList', // 结果存放的字段名
        },
      },
      // 添加answerCount字段，统计答卷数量
      {
        $addFields: {
          answerCount: { $size: '$answerList' },
        },
      },
      // 移除不需要的answerList字段
      { $project: { answerList: 0 } },
      // 排序
      { $sort: { _id: -1 } },
      // 分页
      { $skip: (pageNum - 1) * pageSize },
      { $limit: pageSize },
    ]);

    console.log('findAllList result:');
    console.log('  result length:', result.length);
    console.log('  result:', result);

    return result;
  }

  async countAll(params: CountAllParams): Promise<number> {
    const { keyword = '', isDeleted = false, author = '', isStar } = params;

    const whereOpt: {
      author: string;
      isDeleted: boolean;
      title?: { $regex: RegExp };
      isStar?: boolean;
    } = {
      author,
      isDeleted,
    };

    if (isStar != null) {
      whereOpt.isStar = isStar;
    }

    if (keyword) {
      const reg = new RegExp(keyword, 'i');
      whereOpt.title = { $regex: reg };
    }

    return await this.questionModel.countDocuments(whereOpt);
  }

  async deleteMany(
    ids: string[],
    author: string,
  ): Promise<{ acknowledged: boolean; deletedCount: number }> {
    const now = new Date();
    const res = await this.questionModel.updateMany(
      {
        _id: { $in: ids },
        author,
      },
      {
        isDeleted: true,
        deletedAt: now,
        deletedBy: author,
        deleteReason: '',
      },
    );
    return {
      acknowledged: res.acknowledged,
      deletedCount: res.modifiedCount,
    };
  }

  async duplicate(id: string, author: string): Promise<QuestionDocument> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundException('问卷不存在');
    }

    const question = await this.questionModel.findById(id);

    if (!question) {
      throw new NotFoundException('问卷不存在');
    }

    // 注意：不要把 timestamps 字段（createdAt/updatedAt）复制过去
    // 否则新问卷会保留旧的创建时间。
    const { desc = '', js = '', css = '', componentList = [] } = question;

    const duplicatedComponentList = componentList.map((c) => ({
      fe_id: nanoid(),
      type: c.type,
      title: c.title,
      isHidden: c.isHidden,
      isLocked: c.isLocked,
      props: c.props ?? {},
    }));

    const newQuestion = new this.questionModel({
      title: question.title + ' 副本',
      desc,
      js,
      css,
      author,
      isPublished: false,
      isStar: false,
      isDeleted: false,
      componentList: duplicatedComponentList,
    });

    return await newQuestion.save();
  }

  /**
   * AI 生成问卷结构
   * 调用 AI 服务将自然语言描述转换为问卷数据结构
   */
  async aiGenerateQuestion(prompt: string) {
    // 调用 AI 服务生成问卷结构
    const aiResponse = await this.aiService.generateQuestion({ prompt });

    // 确保所有组件的 fe_id 都是有效的 nanoid
    const sanitizedComponentList = aiResponse.componentList.map(
      (component) => ({
        ...component,
        fe_id: component.fe_id || nanoid(),
      }),
    );

    // 返回标准化的问卷数据结构（对齐导入导出格式）
    return {
      pageInfo: {
        title: aiResponse.pageInfo.title,
        desc: aiResponse.pageInfo.desc || '',
        js: aiResponse.pageInfo.js || '',
        css: aiResponse.pageInfo.css || '',
        isPublished: aiResponse.pageInfo.isPublished || false,
      },
      componentList: sanitizedComponentList,
    };
  }
}
