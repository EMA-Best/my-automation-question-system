"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.TemplateService = void 0;
var common_1 = require("@nestjs/common");
var mongoose_1 = require("@nestjs/mongoose");
var mongoose_2 = require("mongoose");
var nanoid_1 = require("nanoid");
var template_schema_1 = require("./schemas/template.schema");
var question_schema_1 = require("../question/schemas/question.schema");
var answer_schema_1 = require("../answer/schemas/answer.schema");
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
var TemplateService = /** @class */ (function () {
    function TemplateService(
    // 独立 Template 模型（模板资产专用集合）
    templateModel, 
    // Question 模型只用于“使用模板创建问卷”及“从问卷创建模板”读取源问卷
    questionModel, 
    // 答卷模型（预留，后续可用于统计模板生成的问卷收到多少答卷）
    answerModel) {
        this.templateModel = templateModel;
        this.questionModel = questionModel;
        this.answerModel = answerModel;
    }
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
    TemplateService.prototype.countQuestions = function (componentList) {
        var list = Array.isArray(componentList) ? componentList : [];
        return list.filter(function (c) {
            return c &&
                c.type !== 'questionInfo' &&
                c.type !== 'questionParagraph' &&
                c.type !== 'questionTitle' &&
                !c.isHidden;
        }).length;
    };
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
    TemplateService.prototype.buildComponentSummary = function (componentList) {
        var _a;
        var list = Array.isArray(componentList) ? componentList : [];
        var map = new Map();
        for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
            var c = list_1[_i];
            if (!c)
                continue;
            map.set(c.type, ((_a = map.get(c.type)) !== null && _a !== void 0 ? _a : 0) + 1);
        }
        return Array.from(map.entries()).map(function (_a) {
            var type = _a[0], count = _a[1];
            return ({ type: type, count: count });
        });
    };
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
    TemplateService.prototype.cloneComponentList = function (componentList) {
        var list = Array.isArray(componentList) ? componentList : [];
        return list.map(function (c) {
            var _a, _b, _c;
            return ({
                fe_id: nanoid_1.nanoid(),
                type: c.type,
                title: c.title,
                isHidden: (_a = c.isHidden) !== null && _a !== void 0 ? _a : false,
                isLocked: (_b = c.isLocked) !== null && _b !== void 0 ? _b : false,
                props: (_c = c.props) !== null && _c !== void 0 ? _c : {}
            });
        });
    };
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
    TemplateService.prototype.getPublicTemplateList = function (query) {
        return __awaiter(this, void 0, Promise, function () {
            var _a, page, _b, pageSize, keyword, filter, reg, _c, docs, count, list;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = query.page, page = _a === void 0 ? 1 : _a, _b = query.pageSize, pageSize = _b === void 0 ? 12 : _b, keyword = query.keyword;
                        filter = {
                            // 独立模板表中只存在模板数据，这里只需要筛选发布状态。
                            templateStatus: 'published'
                        };
                        // 关键词模糊搜索：同时匹配标题和模板描述
                        if (keyword) {
                            reg = new RegExp(this.escapeRegex(keyword), 'i');
                            filter.$or = [
                                { title: { $regex: reg } },
                                { templateDesc: { $regex: reg } },
                            ];
                        }
                        return [4 /*yield*/, Promise.all([
                                this.templateModel
                                    .find(filter)
                                    .select({
                                    title: 1,
                                    templateDesc: 1,
                                    componentList: 1,
                                    createdAt: 1
                                })
                                    .sort({ sort: -1, _id: -1 }) // 按权重降序，同权重按新旧降序
                                    .skip((page - 1) * pageSize)
                                    .limit(pageSize)
                                    .lean(),
                                this.templateModel.countDocuments(filter),
                            ])];
                    case 1:
                        _c = _d.sent(), docs = _c[0], count = _c[1];
                        list = docs.map(function (doc) {
                            var _a, _b;
                            return ({
                                id: String(doc._id),
                                title: (_a = doc.title) !== null && _a !== void 0 ? _a : '',
                                templateDesc: (_b = doc.templateDesc) !== null && _b !== void 0 ? _b : '',
                                componentSummary: _this.buildComponentSummary(doc.componentList),
                                createdAt: doc.createdAt
                            });
                        });
                        return [2 /*return*/, { list: list, count: count }];
                }
            });
        });
    };
    /**
     * 获取公开模板详情（预览）
     *
     * 只允许访问 templateStatus='published' 的模板：
     * - 草稿状态的模板仅管理员可见，不应暴露给 C 端
     * - 如果 id 无效或模板不存在，统一抛 NotFoundException
     *
     * 返回完整 componentList，供 C 端做“模板预览页”渲染。
     */
    TemplateService.prototype.getPublicTemplateDetail = function (id) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, Promise, function () {
            var doc;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        if (!mongoose_2["default"].Types.ObjectId.isValid(id)) {
                            throw new common_1.NotFoundException('模板不存在');
                        }
                        return [4 /*yield*/, this.templateModel
                                .findOne({
                                _id: id,
                                templateStatus: 'published'
                            })
                                .select({
                                title: 1,
                                templateDesc: 1,
                                js: 1,
                                css: 1,
                                componentList: 1,
                                createdAt: 1
                            })
                                .lean()];
                    case 1:
                        doc = _f.sent();
                        if (!doc) {
                            throw new common_1.NotFoundException('模板不存在');
                        }
                        return [2 /*return*/, {
                                id: String(doc._id),
                                title: (_a = doc.title) !== null && _a !== void 0 ? _a : '',
                                templateDesc: (_b = doc.templateDesc) !== null && _b !== void 0 ? _b : '',
                                js: (_c = doc.js) !== null && _c !== void 0 ? _c : '',
                                css: (_d = doc.css) !== null && _d !== void 0 ? _d : '',
                                componentList: (_e = doc.componentList) !== null && _e !== void 0 ? _e : [],
                                questionCount: this.countQuestions(doc.componentList),
                                createdAt: doc.createdAt
                            }];
                }
            });
        });
    };
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
    TemplateService.prototype.useTemplate = function (templateId, username) {
        var _a, _b, _c;
        return __awaiter(this, void 0, Promise, function () {
            var template, newQuestion, saved;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!mongoose_2["default"].Types.ObjectId.isValid(templateId)) {
                            throw new common_1.NotFoundException('模板不存在');
                        }
                        return [4 /*yield*/, this.templateModel.findOne({
                                _id: templateId,
                                templateStatus: 'published'
                            })];
                    case 1:
                        template = _d.sent();
                        if (!template) {
                            throw new common_1.NotFoundException('模板不存在或已下线');
                        }
                        newQuestion = new this.questionModel({
                            title: (_a = template.title) !== null && _a !== void 0 ? _a : '未命名问卷',
                            desc: '',
                            js: (_b = template.js) !== null && _b !== void 0 ? _b : '',
                            css: (_c = template.css) !== null && _c !== void 0 ? _c : '',
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
                            componentList: this.cloneComponentList(template.componentList)
                        });
                        return [4 /*yield*/, newQuestion.save()];
                    case 2:
                        saved = _d.sent();
                        // 仅在问卷创建成功后统计一次模板使用次数
                        return [4 /*yield*/, this.templateModel.updateOne({ _id: template._id }, { $inc: { useCount: 1 } })];
                    case 3:
                        // 仅在问卷创建成功后统计一次模板使用次数
                        _d.sent();
                        return [2 /*return*/, { questionId: String(saved._id) }];
                }
            });
        });
    };
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
    TemplateService.prototype.adminListTemplates = function (query) {
        return __awaiter(this, void 0, Promise, function () {
            var _a, page, _b, pageSize, keyword, templateStatus, filter, reg, _c, docs, count, list;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = query.page, page = _a === void 0 ? 1 : _a, _b = query.pageSize, pageSize = _b === void 0 ? 10 : _b, keyword = query.keyword, templateStatus = query.templateStatus;
                        filter = {
                        // 模板集合内天然都是模板，无需 isTemplate 过滤
                        };
                        if (templateStatus && ['draft', 'published'].includes(templateStatus)) {
                            filter.templateStatus = templateStatus;
                        }
                        if (keyword) {
                            reg = new RegExp(this.escapeRegex(keyword), 'i');
                            filter.$or = [
                                { title: { $regex: reg } },
                                { templateDesc: { $regex: reg } },
                            ];
                        }
                        return [4 /*yield*/, Promise.all([
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
                                    updatedAt: 1
                                })
                                    .sort({ sort: -1, updatedAt: -1, _id: -1 })
                                    .skip((page - 1) * pageSize)
                                    .limit(pageSize)
                                    .lean(),
                                this.templateModel.countDocuments(filter),
                            ])];
                    case 1:
                        _c = _d.sent(), docs = _c[0], count = _c[1];
                        list = docs.map(function (doc) {
                            var _a, _b, _c, _d, _e;
                            return ({
                                id: String(doc._id),
                                title: (_a = doc.title) !== null && _a !== void 0 ? _a : '',
                                templateDesc: (_b = doc.templateDesc) !== null && _b !== void 0 ? _b : '',
                                templateStatus: (_c = doc.templateStatus) !== null && _c !== void 0 ? _c : 'draft',
                                sort: (_d = doc.sort) !== null && _d !== void 0 ? _d : 0,
                                questionCount: _this.countQuestions(doc.componentList),
                                useCount: (_e = doc.useCount) !== null && _e !== void 0 ? _e : 0,
                                createdAt: doc.createdAt,
                                updatedAt: doc.updatedAt
                            });
                        });
                        return [2 /*return*/, { list: list, count: count }];
                }
            });
        });
    };
    /**
     * 管理员获取模板详情
     *
     * 与 C 端公开详情的区别：
     * - 不受 templateStatus 限制，draft 和 published 都可查看
     * - 额外返回 templateStatus、sort、updatedAt 等管理字段
     * - 用于后台编辑模板时加载数据
     */
    TemplateService.prototype.adminGetTemplateDetail = function (id) {
        var _a, _b, _c, _d, _e, _f, _g;
        return __awaiter(this, void 0, Promise, function () {
            var doc;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        if (!mongoose_2["default"].Types.ObjectId.isValid(id)) {
                            throw new common_1.NotFoundException('模板不存在');
                        }
                        return [4 /*yield*/, this.templateModel.findById(id).lean()];
                    case 1:
                        doc = _h.sent();
                        if (!doc) {
                            throw new common_1.NotFoundException('模板不存在');
                        }
                        return [2 /*return*/, {
                                id: String(doc._id),
                                title: (_a = doc.title) !== null && _a !== void 0 ? _a : '',
                                templateDesc: (_b = doc.templateDesc) !== null && _b !== void 0 ? _b : '',
                                js: (_c = doc.js) !== null && _c !== void 0 ? _c : '',
                                css: (_d = doc.css) !== null && _d !== void 0 ? _d : '',
                                templateStatus: (_e = doc.templateStatus) !== null && _e !== void 0 ? _e : 'draft',
                                sort: (_f = doc.sort) !== null && _f !== void 0 ? _f : 0,
                                componentList: (_g = doc.componentList) !== null && _g !== void 0 ? _g : [],
                                questionCount: this.countQuestions(doc.componentList),
                                createdAt: doc.createdAt,
                                updatedAt: doc.updatedAt
                            }];
                }
            });
        });
    };
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
    TemplateService.prototype.adminCreateTemplate = function (dto, author) {
        var _a, _b, _c, _d;
        return __awaiter(this, void 0, Promise, function () {
            var doc, saved;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        doc = new this.templateModel({
                            title: dto.title || '未命名模板',
                            templateDesc: (_a = dto.templateDesc) !== null && _a !== void 0 ? _a : '',
                            js: (_b = dto.js) !== null && _b !== void 0 ? _b : '',
                            css: (_c = dto.css) !== null && _c !== void 0 ? _c : '',
                            sort: (_d = dto.sort) !== null && _d !== void 0 ? _d : 0,
                            author: author,
                            templateStatus: 'draft',
                            componentList: dto.componentList
                                ? dto.componentList.map(function (c) {
                                    var _a, _b, _c;
                                    return ({
                                        fe_id: c.fe_id || nanoid_1.nanoid(),
                                        type: c.type,
                                        title: c.title,
                                        isHidden: (_a = c.isHidden) !== null && _a !== void 0 ? _a : false,
                                        isLocked: (_b = c.isLocked) !== null && _b !== void 0 ? _b : false,
                                        props: (_c = c.props) !== null && _c !== void 0 ? _c : {}
                                    });
                                })
                                : [
                                    {
                                        fe_id: nanoid_1.nanoid(),
                                        type: 'questionInfo',
                                        title: '问卷信息',
                                        isHidden: false,
                                        isLocked: false,
                                        props: { title: dto.title || '未命名模板', desc: '' }
                                    },
                                ]
                        });
                        return [4 /*yield*/, doc.save()];
                    case 1:
                        saved = _e.sent();
                        return [2 /*return*/, { id: String(saved._id) }];
                }
            });
        });
    };
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
    TemplateService.prototype.adminCreateFromQuestion = function (questionId, author) {
        var _a, _b;
        return __awaiter(this, void 0, Promise, function () {
            var question, doc, saved;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!mongoose_2["default"].Types.ObjectId.isValid(questionId)) {
                            throw new common_1.NotFoundException('问卷不存在');
                        }
                        return [4 /*yield*/, this.questionModel.findById(questionId)];
                    case 1:
                        question = _c.sent();
                        if (!question) {
                            throw new common_1.NotFoundException('问卷不存在');
                        }
                        if (!question.isPublished) {
                            throw new common_1.BadRequestException('未发布问卷不能转为模板，请先发布');
                        }
                        doc = new this.templateModel({
                            title: question.title + ' (模板)',
                            templateDesc: '',
                            js: (_a = question.js) !== null && _a !== void 0 ? _a : '',
                            css: (_b = question.css) !== null && _b !== void 0 ? _b : '',
                            author: author,
                            templateStatus: 'draft',
                            sourceQuestionId: String(question._id),
                            // ---- 重新生成 fe_id ----
                            componentList: this.cloneComponentList(question.componentList)
                        });
                        return [4 /*yield*/, doc.save()];
                    case 2:
                        saved = _c.sent();
                        return [2 /*return*/, { id: String(saved._id) }];
                }
            });
        });
    };
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
    TemplateService.prototype.adminUpdateTemplate = function (id, dto) {
        return __awaiter(this, void 0, Promise, function () {
            var updatePayload, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!mongoose_2["default"].Types.ObjectId.isValid(id)) {
                            throw new common_1.NotFoundException('模板不存在');
                        }
                        updatePayload = {};
                        if (dto.title !== undefined)
                            updatePayload.title = dto.title;
                        if (dto.templateDesc !== undefined)
                            updatePayload.templateDesc = dto.templateDesc;
                        if (dto.js !== undefined)
                            updatePayload.js = dto.js;
                        if (dto.css !== undefined)
                            updatePayload.css = dto.css;
                        if (dto.sort !== undefined)
                            updatePayload.sort = dto.sort;
                        if (dto.componentList !== undefined) {
                            updatePayload.componentList = dto.componentList.map(function (c) {
                                var _a, _b, _c;
                                return ({
                                    fe_id: c.fe_id || nanoid_1.nanoid(),
                                    type: c.type,
                                    title: c.title,
                                    isHidden: (_a = c.isHidden) !== null && _a !== void 0 ? _a : false,
                                    isLocked: (_b = c.isLocked) !== null && _b !== void 0 ? _b : false,
                                    props: (_c = c.props) !== null && _c !== void 0 ? _c : {}
                                });
                            });
                        }
                        return [4 /*yield*/, this.templateModel.updateOne({ _id: id }, updatePayload)];
                    case 1:
                        result = _a.sent();
                        if (result.matchedCount === 0) {
                            throw new common_1.NotFoundException('模板不存在');
                        }
                        return [2 /*return*/, { ok: true }];
                }
            });
        });
    };
    /**
     * 发布模板
     *
     * 将 templateStatus 从 'draft' 改为 'published'，
     * 发布后 C 端公开接口就能查询到这个模板了。
     *
     * @param id 模板 ID
     */
    TemplateService.prototype.adminPublishTemplate = function (id) {
        return __awaiter(this, void 0, Promise, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!mongoose_2["default"].Types.ObjectId.isValid(id)) {
                            throw new common_1.NotFoundException('模板不存在');
                        }
                        return [4 /*yield*/, this.templateModel.updateOne({ _id: id }, { templateStatus: 'published' })];
                    case 1:
                        result = _a.sent();
                        if (result.matchedCount === 0) {
                            throw new common_1.NotFoundException('模板不存在');
                        }
                        return [2 /*return*/, { ok: true }];
                }
            });
        });
    };
    /**
     * 下线模板
     *
     * 将 templateStatus 从 'published' 改回 'draft'，
     * 下线后 C 端不再能看到该模板，也不能“使用此模板”。
     *
     * @param id 模板 ID
     */
    TemplateService.prototype.adminUnpublishTemplate = function (id) {
        return __awaiter(this, void 0, Promise, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!mongoose_2["default"].Types.ObjectId.isValid(id)) {
                            throw new common_1.NotFoundException('模板不存在');
                        }
                        return [4 /*yield*/, this.templateModel.updateOne({ _id: id }, { templateStatus: 'draft' })];
                    case 1:
                        result = _a.sent();
                        if (result.matchedCount === 0) {
                            throw new common_1.NotFoundException('模板不存在');
                        }
                        return [2 /*return*/, { ok: true }];
                }
            });
        });
    };
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
    TemplateService.prototype.adminDeleteTemplate = function (id) {
        return __awaiter(this, void 0, Promise, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!mongoose_2["default"].Types.ObjectId.isValid(id)) {
                            throw new common_1.NotFoundException('模板不存在');
                        }
                        return [4 /*yield*/, this.templateModel.deleteOne({ _id: id })];
                    case 1:
                        result = _a.sent();
                        if (result.deletedCount === 0) {
                            throw new common_1.NotFoundException('模板不存在');
                        }
                        return [2 /*return*/, { ok: true }];
                }
            });
        });
    };
    // ================================
    // 私有工具
    // ================================
    /**
     * 转义正则表达式特殊字符
     *
     * 用于关键词搜索时避免用户输入的特殊字符被解释为正则语法，
     * 例如用户搜索 "c++" 不会报错。
     */
    TemplateService.prototype.escapeRegex = function (input) {
        return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    TemplateService = __decorate([
        common_1.Injectable(),
        __param(0, mongoose_1.InjectModel(template_schema_1.Template.name)),
        __param(1, mongoose_1.InjectModel(question_schema_1.Question.name)),
        __param(2, mongoose_1.InjectModel(answer_schema_1.Answer.name))
    ], TemplateService);
    return TemplateService;
}());
exports.TemplateService = TemplateService;
