import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { nanoid } from 'nanoid';
import { Template, type TemplateDocument } from './schemas/template.schema';
import {
  Question,
  type QuestionDocument,
} from '../question/schemas/question.schema';
import { Answer, type AnswerDocument } from '../answer/schemas/answer.schema';
import type { CreateTemplateDto } from './dto/create-template.dto';
import type { UpdateTemplateDto } from './dto/update-template.dto';

// ============================================================================
// 返回类型定义
//
// 模板复用了 Question 集合（通过 isTemplate 字段区分），
// 但对外返回时使用独立类型，避免泄漏内部字段细节。
// ============================================================================

/**
 * C 端模板列表项
 *
 * 用于公开列表接口返回，只包含卡片展示需要的字段。
 * 注意：返回的是 componentSummary（组件类型摘要）而不是完整 componentList，
 * 以减小响应体积、提升首屏加载速度。
 */
export type TemplateListItem = {
  id: string;
  title: string;
  templateDesc: string;
  componentSummary: Array<{ type: string; count: number }>;
  createdAt?: Date;
};

/**
 * C 端模板详情
 *
 * 用于公开详情/预览接口返回，包含完整 componentList，
 * 供 C 端做“模板预览页”渲染。
 */
export type TemplateDetail = {
  id: string;
  title: string;
  templateDesc: string;
  js: string;
  css: string;
  componentList: Question['componentList'];
  questionCount: number;
  createdAt?: Date;
};

/**
 * lean 查询结果类型
 *
 * Mongoose的 .lean() 返回的是纯 JS 对象（非 Document），
 * 需要显式指定类型以获得 TypeScript 类型推导支持。
 * 这里的字段都是可选的，因为 .select() 可能只返回部分字段。
 */
type TemplateLeanDoc = {
  _id: mongoose.Types.ObjectId;
  title?: string;
  templateDesc?: string;
  js?: string;
  css?: string;
  sort?: number;
  useCount?: number;
  templateStatus?: string;
  componentList?: Question['componentList'];
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * 管理端模板列表项
 *
 * 与 C 端列表项的区别：
 * - 额外包含 templateStatus、sort、useCount、updatedAt 等管理字段
 * - 同时返回 draft 和 published 状态的模板
 */
export type AdminTemplateListItem = {
  id: string;
  title: string;
  templateDesc: string;
  templateStatus: string;
  sort: number;
  questionCount: number;
  useCount: number;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * 模板业务服务
 *
 * 设计思路：
 * - 模板数据使用独立 Template 集合
 * - 注入 QuestionModel 操作模板数据，注入 AnswerModel 预留统计能力
 *
 * 接口分层：
 * 1. C 端公开接口（无需登录）：模板列表 + 模板详情
 * 2. “使用模板”接口（需要登录）：克隆模板为新问卷
 * 3. 管理员接口：模板 CRUD / 发布 / 下线
 */
@Injectable()
export class TemplateService {
  constructor(
    // 独立 Template 模型（模板资产专用集合）
    @InjectModel(Template.name)
    private readonly templateModel: Model<TemplateDocument>,
    // Question 模型只用于“使用模板创建问卷”及“从问卷创建模板”读取源问卷
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
    // 答卷模型（预留，后续可用于统计模板生成的问卷收到多少答卷）
    @InjectModel(Answer.name)
    private readonly answerModel: Model<AnswerDocument>,
  ) {}

  // ================================
  // 工具方法
  // ================================

  /**
   * 统计题目数量
   *
   * 口径说明（与 QuestionService.countQuestions 保持一致）：
   * - componentList 中既有真正的题目组件，也可能有“问卷信息/段落/标题”等展示类组件
   * - 约定：questionInfo / questionParagraph / questionTitle 不计入题目数
   * - 约定：isHidden=true 的组件不计入题目数
   *
   * @param componentList 问卷/模板的组件列表
   * @returns 有效题目的数量
   */
  private countQuestions(
    componentList: Question['componentList'] | undefined,
  ): number {
    const list = Array.isArray(componentList) ? componentList : [];
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
   * 生成 componentSummary（按组件类型聚合数量）
   *
   * 用于 C 端列表卡片展示，避免返回完整 componentList。
   * 例如：[{ type: 'questionInput', count: 3 }, { type: 'questionRadio', count: 2 }]
   * 这样前端可以在卡片上显示“含 3 个输入题、 2 个单选题”。
   *
   * @param componentList 问卷/模板的组件列表
   * @returns 按组件 type 聚合后的摘要数组
   */
  private buildComponentSummary(
    componentList: Question['componentList'] | undefined,
  ): Array<{ type: string; count: number }> {
    const list = Array.isArray(componentList) ? componentList : [];
    const map = new Map<string, number>();
    for (const c of list) {
      if (!c) continue;
      map.set(c.type, (map.get(c.type) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([type, count]) => ({ type, count }));
  }

  /**
   * 克隆 componentList 并重新生成 fe_id
   *
   * 为什么必须重新生成 fe_id：
   * - fe_id 是前端编辑器用来唯一识别组件的 key
   * - 如果多个问卷共用同一组 fe_id，编辑器里拖拽/删除会出现 key 冲突
   * - 因此每次克隆（使用模板 / 复制问卷 / 从问卷创建模板）都必须重新生成
   *
   * @param componentList 源组件列表
   * @returns 新的 componentList，每个组件的 fe_id 均为新生成的 nanoid
   */
  private cloneComponentList(
    componentList:
      | Question['componentList']
      | Array<{
          fe_id?: string;
          type: string;
          title: string;
          isHidden?: boolean;
          isLocked?: boolean;
          props?: Record<string, unknown>;
        }>
      | undefined,
  ): Question['componentList'] {
    const list = Array.isArray(componentList) ? componentList : [];
    return list.map((c) => ({
      fe_id: nanoid(),
      type: c.type,
      title: c.title,
      isHidden: c.isHidden ?? false,
      isLocked: c.isLocked ?? false,
      props: c.props ?? {},
    }));
  }

  // ================================
  // C 端公开接口（无需登录）
  //
  // 下面两个方法对应的 Controller 均加了 @Public() 装饰器，
  // 表示不需要携带 JWT Token 也能访问。
  // 它们只返回 templateStatus='published' 的模板，
  // 草稿状态的模板不会暴露给 C 端用户。
  // ================================

  /**
   * 获取公开模板列表
   *
   * 筛选条件：
   * - isTemplate=true：只查模板，不查普通问卷
   * - templateStatus='published'：只查已发布的
   *
   * 可选筛选：
   * - keyword：模糊匹配标题或模板描述
   *
   * 返回 componentSummary 而非完整 componentList，减小响应体积
   *
   * 排序规则：
   * - sort 降序（权重越大越靠前）
   * - _id 降序（同权重时按创建时间倒序）
   */
  async getPublicTemplateList(query: {
    page?: number;
    pageSize?: number;
    keyword?: string;
  }): Promise<{ list: TemplateListItem[]; count: number }> {
    const { page = 1, pageSize = 12, keyword } = query;

    const filter: Record<string, unknown> = {
      // 独立模板表中只存在模板数据，这里只需要筛选发布状态。
      templateStatus: 'published',
    };

    // 关键词模糊搜索：同时匹配标题和模板描述
    if (keyword) {
      const reg = new RegExp(this.escapeRegex(keyword), 'i');
      filter.$or = [
        { title: { $regex: reg } },
        { templateDesc: { $regex: reg } },
      ];
    }
    // 并行执行查询 + 计数，性能优于串行
    const [docs, count] = await Promise.all([
      this.templateModel
        .find(filter)
        .select({
          title: 1, // 模板标题
          templateDesc: 1, // 模板描述（C 端卡片展示用）
          componentList: 1, // 用来生成 componentSummary，不会直接返回给前端
          createdAt: 1, // 创建时间
        })
        .sort({ sort: -1, _id: -1 }) // 按权重降序，同权重按新旧降序
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<TemplateLeanDoc[]>(),
      this.templateModel.countDocuments(filter), // 总数用于分页
    ]);

    // 将 Mongoose lean 文档转换为前端友好的类型
    // 注意：_id 转换为 id 字符串，componentList 转换为 componentSummary
    const list: TemplateListItem[] = docs.map((doc) => ({
      id: String(doc._id), // ObjectId 转字符串
      title: doc.title ?? '',
      templateDesc: doc.templateDesc ?? '',
      componentSummary: this.buildComponentSummary(doc.componentList), // 聚合组件摘要
      createdAt: doc.createdAt,
    }));

    return { list, count };
  }

  /**
   * 获取公开模板详情（预览）
   *
   * 只允许访问 templateStatus='published' 的模板：
   * - 草稿状态的模板仅管理员可见，不应暴露给 C 端
   * - 如果 id 无效或模板不存在，统一抛 NotFoundException
   *
   * 返回完整 componentList，供 C 端做“模板预览页”渲染。
   */
  async getPublicTemplateDetail(id: string): Promise<TemplateDetail> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundException('模板不存在');
    }

    // 查询条件：必须是模板 + 已发布
    const doc = await this.templateModel
      .findOne({
        _id: id,
        templateStatus: 'published', // 只查已发布的
      })
      .select({
        title: 1, // 模板标题
        templateDesc: 1, // 模板描述
        js: 1, // 自定义 JS
        css: 1, // 自定义 CSS
        componentList: 1, // 完整组件列表（用于预览渲染）
        createdAt: 1,
      })
      .lean<TemplateLeanDoc>();

    if (!doc) {
      throw new NotFoundException('模板不存在');
    }

    return {
      id: String(doc._id),
      title: doc.title ?? '',
      templateDesc: doc.templateDesc ?? '',
      js: doc.js ?? '',
      css: doc.css ?? '',
      componentList: doc.componentList ?? [],
      questionCount: this.countQuestions(doc.componentList),
      createdAt: doc.createdAt,
    };
  }

  // ================================
  // "使用模板"（需要登录）
  //
  // 这是整个模板系统的核心接口：
  // C 端用户点击“使用此模板”→ 调用此接口 → 后端克隆模板为新问卷
  // → 返回 questionId → 前端跳转到 B 端编辑页
  //
  // 为什么克隆必须由后端执行：
  // - 需要设置正确的 author/owner
  // - 需要重置审核状态、发布状态等字段
  // - 需要重新生成 fe_id 避免编辑器 key 冲突
  // - 避免前端承担归属/权限/审计字段初始化等复杂职责
  // ================================

  /**
   * 使用模板创建问卷
   *
   * 完整流程：
   * 1. 校验 templateId 是否是合法的 ObjectId
   * 2. 查询模板是否存在且 templateStatus='published'
   * 3. 克隆模板结构为新问卷，设置 author = 当前登录用户
   * 4. 重置所有运营/审核/发布字段为默认值
   * 5. componentList 重新生成 fe_id
   * 6. 返回新问卷的 id
   *
   * @param templateId 模板 ID
   * @param username 当前登录用户的用户名（作为新问卷的 author）
   * @returns { questionId: string } 新创建的问卷 ID
   */
  async useTemplate(
    templateId: string,
    username: string,
  ): Promise<{ questionId: string }> {
    if (!mongoose.Types.ObjectId.isValid(templateId)) {
      throw new NotFoundException('模板不存在');
    }

    // 查询条件：必须是模板 + 已发布（草稿/下线的模板不允许使用）
    const template = await this.templateModel.findOne({
      _id: templateId,
      templateStatus: 'published',
    });

    if (!template) {
      throw new NotFoundException('模板不存在或已下线');
    }

    // 克隆为普通问卷
    // 注意：这里只复制结构字段（title/js/css/componentList），
    // 不复制运营字段（featured/pinned）、模板字段（isTemplate/templateStatus）、
    // 审核字段（auditStatus）、统计数据等
    const newQuestion = new this.questionModel({
      title: template.title ?? '未命名问卷',
      desc: '',
      js: template.js ?? '',
      css: template.css ?? '',
      author: username,
      // ---- 重置为普通问卷默认值 ----
      isPublished: false,
      isStar: false,
      isDeleted: false,
      auditStatus: 'Draft',
      auditReason: '',
      auditUpdatedAt: new Date(),
      featured: false,
      pinned: false,
      pinnedAt: null,
      // ---- 重新生成每个组件的 fe_id ----
      componentList: this.cloneComponentList(template.componentList),
    });

    const saved = await newQuestion.save();

    // 仅在问卷创建成功后统计一次模板使用次数
    await this.templateModel.updateOne(
      { _id: template._id },
      { $inc: { useCount: 1 } },
    );

    return { questionId: String(saved._id) };
  }

  // ================================
  // 管理员接口
  //
  // 以下方法均需要 admin 权限，
  // 对应的 Controller 用 @RequirePermissions() 装饰器校验。
  // ================================

  /**
   * 管理员模板列表
   *
   * 与 C 端公开列表的区别：
   * - 同时返回 draft 和 published 状态的模板
   * - 返回更多管理字段：templateStatus、sort、useCount、updatedAt
   * - 支持按 templateStatus 筛选
   */
  async adminListTemplates(query: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    templateStatus?: string;
  }): Promise<{ list: AdminTemplateListItem[]; count: number }> {
    const { page = 1, pageSize = 10, keyword, templateStatus } = query;

    const filter: Record<string, unknown> = {
      // 模板集合内天然都是模板，无需 isTemplate 过滤
    };

    if (templateStatus && ['draft', 'published'].includes(templateStatus)) {
      filter.templateStatus = templateStatus;
    }
    if (keyword) {
      const reg = new RegExp(this.escapeRegex(keyword), 'i');
      filter.$or = [
        { title: { $regex: reg } },
        { templateDesc: { $regex: reg } },
      ];
    }

    const [docs, count] = await Promise.all([
      this.templateModel
        .find(filter)
        .select({
          title: 1,
          templateDesc: 1,
          templateStatus: 1,
          sort: 1,
          useCount: 1,
          componentList: 1,
          createdAt: 1,
          updatedAt: 1,
        })
        .sort({ sort: -1, updatedAt: -1, _id: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<TemplateLeanDoc[]>(),
      this.templateModel.countDocuments(filter),
    ]);

    const list: AdminTemplateListItem[] = docs.map((doc) => ({
      id: String(doc._id),
      title: doc.title ?? '',
      templateDesc: doc.templateDesc ?? '',
      templateStatus: doc.templateStatus ?? 'draft',
      sort: doc.sort ?? 0,
      questionCount: this.countQuestions(doc.componentList),
      useCount: doc.useCount ?? 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    return { list, count };
  }

  /**
   * 管理员获取模板详情
   *
   * 与 C 端公开详情的区别：
   * - 不受 templateStatus 限制，draft 和 published 都可查看
   * - 额外返回 templateStatus、sort、updatedAt 等管理字段
   * - 用于后台编辑模板时加载数据
   */
  async adminGetTemplateDetail(id: string): Promise<
    TemplateDetail & {
      templateStatus: string;
      sort: number;
      updatedAt?: Date;
    }
  > {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundException('模板不存在');
    }

    const doc = await this.templateModel.findById(id).lean<TemplateLeanDoc>();

    if (!doc) {
      throw new NotFoundException('模板不存在');
    }

    return {
      id: String(doc._id),
      title: doc.title ?? '',
      templateDesc: doc.templateDesc ?? '',
      js: doc.js ?? '',
      css: doc.css ?? '',
      templateStatus: doc.templateStatus ?? 'draft',
      sort: doc.sort ?? 0,
      componentList: doc.componentList ?? [],
      questionCount: this.countQuestions(doc.componentList),
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  /**
   * 创建空模板
   *
   * 管理员从零开始创建模板：
   * - 默认 templateStatus='draft'（需要手动发布才会对 C 端可见）
   * - 如果传了 componentList，确保每个组件有合法的 fe_id
   * - 如果没传 componentList，自动创建一个 questionInfo 组件作为初始内容
   * - isTemplate=true 标识这是模板而非普通问卷
   *
   * @param dto 创建模板的参数（title 必填，其他可选）
   * @param author 创建者的用户名
   * @returns { id: string } 新创建的模板 ID
   */
  async adminCreateTemplate(
    dto: CreateTemplateDto,
    author: string,
  ): Promise<{ id: string }> {
    const doc = new this.templateModel({
      title: dto.title || '未命名模板',
      templateDesc: dto.templateDesc ?? '',
      js: dto.js ?? '',
      css: dto.css ?? '',
      sort: dto.sort ?? 0,
      author,
      templateStatus: 'draft',
      componentList: dto.componentList
        ? dto.componentList.map((c) => ({
            fe_id: c.fe_id || nanoid(),
            type: c.type,
            title: c.title,
            isHidden: c.isHidden ?? false,
            isLocked: c.isLocked ?? false,
            props: c.props ?? {},
          }))
        : [
            {
              fe_id: nanoid(),
              type: 'questionInfo',
              title: '问卷信息',
              isHidden: false,
              isLocked: false,
              props: { title: dto.title || '未命名模板', desc: '' },
            },
          ],
    });

    const saved = await doc.save();
    return { id: String(saved._id) };
  }

  /**
   * 从现有问卷保存为模板
   *
   * 管理员可以将任何现有问卷克隆为模板：
   * - 复制问卷的结构字段（title/js/css/componentList）
   * - 重置所有运营/审核字段
   * - 重新生成 componentList 中每个组件的 fe_id
   * - 默认 templateStatus='draft'，需要手动发布
   *
   * @param questionId 源问卷 ID
   * @param author 操作者用户名
   * @returns { id: string } 新创建的模板 ID
   */
  async adminCreateFromQuestion(
    questionId: string,
    author: string,
  ): Promise<{ id: string }> {
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      throw new NotFoundException('问卷不存在');
    }

    const question = await this.questionModel.findById(questionId);
    if (!question) {
      throw new NotFoundException('问卷不存在');
    }

    if (!question.isPublished) {
      throw new BadRequestException('未发布问卷不能转为模板，请先发布');
    }

    const doc = new this.templateModel({
      title: question.title + ' (模板)',
      templateDesc: '',
      js: question.js ?? '',
      css: question.css ?? '',
      author,
      templateStatus: 'draft',
      sourceQuestionId: String(question._id),
      // ---- 重新生成 fe_id ----
      componentList: this.cloneComponentList(question.componentList),
    });

    const saved = await doc.save();

    return { id: String(saved._id) };
  }

  /**
   * 更新模板
   *
   * 支持部分更新（只传需要修改的字段）：
   * - 标题/描述/js/css/封面图/分类/标签/排序权重
   * - componentList（如果传了，会确保每个组件都有合法的 fe_id）
   *
   * 安全约束：
   * - 只能更新 isTemplate=true 的记录，避免误改普通问卷
   * - matchedCount=0 时抛出 NotFoundException
   *
   * @param id 模板 ID
   * @param dto 要更新的字段（都是可选的）
   */
  async adminUpdateTemplate(
    id: string,
    dto: UpdateTemplateDto,
  ): Promise<{ ok: boolean }> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundException('模板不存在');
    }

    const updatePayload: Record<string, unknown> = {};

    if (dto.title !== undefined) updatePayload.title = dto.title;
    if (dto.templateDesc !== undefined)
      updatePayload.templateDesc = dto.templateDesc;
    if (dto.js !== undefined) updatePayload.js = dto.js;
    if (dto.css !== undefined) updatePayload.css = dto.css;
    if (dto.sort !== undefined) updatePayload.sort = dto.sort;

    if (dto.componentList !== undefined) {
      updatePayload.componentList = dto.componentList.map((c) => ({
        fe_id: c.fe_id || nanoid(),
        type: c.type,
        title: c.title,
        isHidden: c.isHidden ?? false,
        isLocked: c.isLocked ?? false,
        props: c.props ?? {},
      }));
    }

    const result = await this.templateModel.updateOne(
      { _id: id },
      updatePayload,
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException('模板不存在');
    }

    return { ok: true };
  }

  /**
   * 发布模板
   *
   * 将 templateStatus 从 'draft' 改为 'published'，
   * 发布后 C 端公开接口就能查询到这个模板了。
   *
   * @param id 模板 ID
   */
  async adminPublishTemplate(id: string): Promise<{ ok: boolean }> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundException('模板不存在');
    }

    const result = await this.templateModel.updateOne(
      { _id: id },
      { templateStatus: 'published' },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException('模板不存在');
    }

    return { ok: true };
  }

  /**
   * 下线模板
   *
   * 将 templateStatus 从 'published' 改回 'draft'，
   * 下线后 C 端不再能看到该模板，也不能“使用此模板”。
   *
   * @param id 模板 ID
   */
  async adminUnpublishTemplate(id: string): Promise<{ ok: boolean }> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundException('模板不存在');
    }

    const result = await this.templateModel.updateOne(
      { _id: id },
      { templateStatus: 'draft' },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundException('模板不存在');
    }

    return { ok: true };
  }

  /**
   * 删除模板（硬删除）
   *
   * 模板不走回收站逻辑（普通问卷是软删除 isDeleted=true），
   * 而是直接从数据库中移除。
   *
   * 安全约束：只能删除 isTemplate=true 的记录
   *
   * @param id 模板 ID
   */
  async adminDeleteTemplate(id: string): Promise<{ ok: boolean }> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new NotFoundException('模板不存在');
    }

    const result = await this.templateModel.deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      throw new NotFoundException('模板不存在');
    }

    return { ok: true };
  }

  // ================================
  // 私有工具
  // ================================

  /**
   * 转义正则表达式特殊字符
   *
   * 用于关键词搜索时避免用户输入的特殊字符被解释为正则语法，
   * 例如用户搜索 "c++" 不会报错。
   */

  private escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
