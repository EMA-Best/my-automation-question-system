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
    // 依赖注入 AI 服务
    private readonly aiService: AIService,
  ) {}

  async create(username: string): Promise<QuestionDocument> {
    const question = new this.questionModel({
      title: '问卷标题' + Date.now(),
      desc: '问卷描述',
      author: username,
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
    // return await this.questionModel.findByIdAndDelete(id);
    return await this.questionModel.findOneAndDelete({ _id: id, author });
  }

  async update(
    id: string,
    questionDto: unknown,
    author: string,
  ): Promise<QuestionUpdateResult> {
    const updatePayload: QuestionDto = {};

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
    const res = await this.questionModel.deleteMany({
      _id: { $in: ids },
      author,
    });
    return res;
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
