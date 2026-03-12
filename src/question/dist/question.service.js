"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.QuestionService = void 0;
var common_1 = require("@nestjs/common");
var mongoose_1 = require("@nestjs/mongoose");
var question_schema_1 = require("./schemas/question.schema");
var mongoose_2 = require("mongoose");
var nanoid_1 = require("nanoid");
var answer_schema_1 = require("../answer/schemas/answer.schema");
var question_review_schema_1 = require("../review/schemas/question-review.schema");
var QuestionService = /** @class */ (function () {
    function QuestionService(
    // 依赖注入问题模型
    questionModel, questionReviewModel, answerModel, 
    // 依赖注入 AI 服务
    aiService) {
        this.questionModel = questionModel;
        this.questionReviewModel = questionReviewModel;
        this.answerModel = answerModel;
        this.aiService = aiService;
    }
    /**
     * 统计题目数量（用于首页/列表的“题目数”展示）
     *
     * 口径说明：
     * - componentList 中既有真正的题目组件，也可能有“问卷信息/说明”类组件
     * - 约定：type === 'questionInfo' 仅做展示说明，不计入题目数量
     * - 约定：isHidden === true 的组件不展示给用户，也不计入题目数量
     */
    QuestionService.prototype.countQuestions = function (componentList) {
        var list = Array.isArray(componentList) ? componentList : [];
        // 约定：questionInfo questionParagraph questionTitle属于说明/标题，不计入题目数；隐藏组件也不计入
        return list.filter(function (c) {
            return c &&
                c.type !== 'questionInfo' &&
                c.type !== 'questionParagraph' &&
                c.type !== 'questionTitle' &&
                !c.isHidden;
        }).length;
    };
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
    QuestionService.prototype.getAnswerCountMap = function (questionIds) {
        return __awaiter(this, void 0, Promise, function () {
            var ids, map, rows;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ids = questionIds
                            .map(function (id) { return (typeof id === 'string' ? id.trim() : ''); })
                            .filter(Boolean);
                        map = new Map();
                        if (ids.length === 0)
                            return [2 /*return*/, map];
                        return [4 /*yield*/, this.answerModel.aggregate([
                                { $match: { questionId: { $in: ids } } },
                                { $group: { _id: '$questionId', count: { $sum: 1 } } },
                            ])];
                    case 1:
                        rows = _a.sent();
                        rows.forEach(function (r) {
                            map.set(r._id, typeof r.count === 'number' ? r.count : 0);
                        });
                        return [2 /*return*/, map];
                }
            });
        });
    };
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
    QuestionService.prototype.getFeaturedQuestions = function () {
        return __awaiter(this, void 0, Promise, function () {
            var questions, ids, answerCountMap;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.questionModel
                            .find({
                            isDeleted: false,
                            isPublished: true,
                            $or: [{ featured: true }, { pinned: true }]
                        })
                            .select({
                            title: 1,
                            desc: 1,
                            featured: 1,
                            pinned: 1,
                            pinnedAt: 1,
                            componentList: 1
                        })
                            .sort({ pinned: -1, pinnedAt: -1, featured: -1, updatedAt: -1, _id: -1 })
                            .lean()];
                    case 1:
                        questions = _a.sent();
                        ids = questions.map(function (q) { return String(q._id); });
                        return [4 /*yield*/, this.getAnswerCountMap(ids)];
                    case 2:
                        answerCountMap = _a.sent();
                        return [2 /*return*/, questions.map(function (q) {
                                var _a, _b, _c, _d;
                                var id = String(q._id);
                                return {
                                    id: id,
                                    title: (_a = q.title) !== null && _a !== void 0 ? _a : '',
                                    desc: (_b = q.desc) !== null && _b !== void 0 ? _b : '',
                                    featured: Boolean(q.featured),
                                    pinned: Boolean(q.pinned),
                                    pinnedAt: (_c = q.pinnedAt) !== null && _c !== void 0 ? _c : null,
                                    // 题目数：按约定口径计算（排除说明类组件、隐藏组件）
                                    questionCount: _this.countQuestions(q.componentList),
                                    // 答卷数：来自 answers 聚合统计
                                    answerCount: (_d = answerCountMap.get(id)) !== null && _d !== void 0 ? _d : 0
                                };
                            })];
                }
            });
        });
    };
    /**
     * 获取问卷预览信息（公开）
     *
     * 仅允许访问已发布且未删除的问卷。
     * 这与 findOnePublic 的逻辑不同：
     * - findOnePublic 允许作者访问未发布问卷（用于填写/预览草稿）
     * - preview 是给“公开预览页”用的，必须严格只返回已发布
     */
    QuestionService.prototype.getQuestionPreview = function (id) {
        var _a, _b, _c, _d, _e;
        return __awaiter(this, void 0, Promise, function () {
            var question, qid, answerCountMap;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        // 先校验 ObjectId，避免 mongoose CastError
                        if (!mongoose_2["default"].Types.ObjectId.isValid(id)) {
                            throw new common_1.NotFoundException('问卷不存在');
                        }
                        return [4 /*yield*/, this.questionModel
                                .findOne({
                                _id: id,
                                isDeleted: false,
                                isPublished: true
                            })
                                .select({
                                title: 1,
                                desc: 1,
                                componentList: 1,
                                featured: 1,
                                pinned: 1,
                                pinnedAt: 1
                            })
                                .lean()];
                    case 1:
                        question = _f.sent();
                        if (!question) {
                            throw new common_1.NotFoundException('问卷不存在');
                        }
                        qid = String(question._id);
                        return [4 /*yield*/, this.getAnswerCountMap([qid])];
                    case 2:
                        answerCountMap = _f.sent();
                        return [2 /*return*/, {
                                id: qid,
                                title: (_a = question.title) !== null && _a !== void 0 ? _a : '',
                                desc: (_b = question.desc) !== null && _b !== void 0 ? _b : '',
                                componentList: (_c = question.componentList) !== null && _c !== void 0 ? _c : [],
                                featured: Boolean(question.featured),
                                pinned: Boolean(question.pinned),
                                pinnedAt: (_d = question.pinnedAt) !== null && _d !== void 0 ? _d : null,
                                questionCount: this.countQuestions(question.componentList),
                                answerCount: (_e = answerCountMap.get(qid)) !== null && _e !== void 0 ? _e : 0
                            }];
                }
            });
        });
    };
    QuestionService.prototype.create = function (username) {
        return __awaiter(this, void 0, Promise, function () {
            var question;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        question = new this.questionModel({
                            title: '问卷标题' + Date.now(),
                            desc: '问卷描述',
                            author: username,
                            auditStatus: 'Draft',
                            auditUpdatedAt: new Date(),
                            componentList: [
                                {
                                    fe_id: nanoid_1.nanoid(),
                                    type: 'questionInfo',
                                    title: '问卷信息',
                                    props: { title: '问卷标题', desc: '问卷描述...' }
                                },
                            ]
                        });
                        return [4 /*yield*/, question.save()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    QuestionService.prototype.submitReview = function (id, username) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var question, currentStatus, review, saved;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!mongoose_2["default"].Types.ObjectId.isValid(id)) {
                            throw new common_1.NotFoundException('问卷不存在');
                        }
                        return [4 /*yield*/, this.questionModel.findOne({
                                _id: id,
                                author: username
                            })];
                    case 1:
                        question = _b.sent();
                        if (!question) {
                            throw new common_1.NotFoundException('问卷不存在');
                        }
                        if (question.isDeleted) {
                            throw new common_1.BadRequestException('问卷已删除，无法提交审核');
                        }
                        if (question.isPublished) {
                            throw new common_1.BadRequestException('已发布问卷不支持提交审核');
                        }
                        currentStatus = (_a = question.auditStatus) !== null && _a !== void 0 ? _a : 'Draft';
                        if (currentStatus === 'PendingReview') {
                            throw new common_1.BadRequestException('问卷已在审核中');
                        }
                        question.auditStatus = 'PendingReview';
                        question.auditReason = '';
                        question.auditUpdatedAt = new Date();
                        return [4 /*yield*/, question.save()];
                    case 2:
                        _b.sent();
                        review = new this.questionReviewModel({
                            questionId: question._id,
                            author: question.author,
                            submitter: username,
                            status: 'PendingReview',
                            reason: '',
                            submittedAt: new Date(),
                            reviewedAt: null
                        });
                        return [4 /*yield*/, review.save()];
                    case 3:
                        saved = _b.sent();
                        return [2 /*return*/, {
                                ok: true,
                                reviewId: saved._id
                            }];
                }
            });
        });
    };
    QuestionService.prototype.aiGenerateQuestionStream = function (prompt, handlers, signal) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.aiService.generateQuestionStream({ prompt: prompt }, handlers, signal)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    QuestionService.prototype.findOne = function (id) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // 在查询前校验 ObjectId，避免 CastError
                        if (!mongoose_2["default"].Types.ObjectId.isValid(id)) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, this.questionModel.findById(id)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    QuestionService.prototype.findOnePublic = function (id, username) {
        return __awaiter(this, void 0, Promise, function () {
            var question;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!mongoose_2["default"].Types.ObjectId.isValid(id)) {
                            throw new common_1.NotFoundException('问卷不存在');
                        }
                        return [4 /*yield*/, this.questionModel.findById(id)];
                    case 1:
                        question = _a.sent();
                        if (!question) {
                            throw new common_1.NotFoundException('问卷不存在');
                        }
                        // 已发布：任何人可访问
                        if (question.isPublished)
                            return [2 /*return*/, question];
                        // 未发布：仅作者可访问
                        if (username && question.author === username)
                            return [2 /*return*/, question];
                        throw new common_1.ForbiddenException('无权访问未发布问卷');
                }
            });
        });
    };
    QuestionService.prototype["delete"] = function (id, author) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!mongoose_2["default"].Types.ObjectId.isValid(id)) {
                            throw new common_1.NotFoundException('问卷不存在');
                        }
                        return [4 /*yield*/, this.questionModel.findOneAndUpdate({ _id: id, author: author }, {
                                isDeleted: true,
                                deletedAt: new Date(),
                                deletedBy: author,
                                deleteReason: ''
                            }, { "new": true })];
                    case 1: 
                    // 软删除：写入删除审计字段，供管理员回收站展示
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    QuestionService.prototype.update = function (id, questionDto, author) {
        return __awaiter(this, void 0, Promise, function () {
            var updatePayload, auditPayload, res_1, record, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        updatePayload = {};
                        auditPayload = {};
                        if (!(typeof questionDto !== 'object' || questionDto == null)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.questionModel.updateOne({
                                _id: id,
                                author: author
                            }, updatePayload)];
                    case 1:
                        res_1 = _a.sent();
                        return [2 /*return*/, {
                                acknowledged: res_1.acknowledged,
                                matchedCount: res_1.matchedCount,
                                modifiedCount: res_1.modifiedCount,
                                upsertedCount: res_1.upsertedCount,
                                upsertedId: res_1.upsertedId
                            }];
                    case 2:
                        record = questionDto;
                        // 字段白名单：避免客户端传 author 等敏感字段
                        if (typeof record.title === 'string')
                            updatePayload.title = record.title;
                        if (typeof record.desc === 'string')
                            updatePayload.desc = record.desc;
                        if (typeof record.js === 'string')
                            updatePayload.js = record.js;
                        if (typeof record.css === 'string')
                            updatePayload.css = record.css;
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
                                }
                                else {
                                    auditPayload.deleteReason = '';
                                }
                            }
                            else {
                                auditPayload.restoredAt = new Date();
                                auditPayload.restoredBy = author;
                            }
                        }
                        if (record.componentList != null) {
                            updatePayload.componentList = this.sanitizeComponentList(record.componentList);
                        }
                        return [4 /*yield*/, this.questionModel.updateOne({
                                _id: id,
                                author: author
                            }, __assign(__assign({}, updatePayload), auditPayload))];
                    case 3:
                        res = _a.sent();
                        return [2 /*return*/, {
                                acknowledged: res.acknowledged,
                                matchedCount: res.matchedCount,
                                modifiedCount: res.modifiedCount,
                                upsertedCount: res.upsertedCount,
                                upsertedId: res.upsertedId
                            }];
                }
            });
        });
    };
    QuestionService.prototype.sanitizeComponentList = function (input) {
        if (!Array.isArray(input)) {
            throw new common_1.BadRequestException('componentList 必须是数组');
        }
        var usedIds = new Set();
        return input
            .map(function (raw) {
            if (typeof raw !== 'object' || raw == null)
                return null;
            var record = raw;
            var type = typeof record.type === 'string' ? record.type : '';
            if (!type)
                return null;
            var title = typeof record.title === 'string' ? record.title : type;
            var props = typeof record.props === 'object' && record.props != null
                ? record.props
                : {};
            var fe_id = typeof record.fe_id === 'string' ? record.fe_id : '';
            if (!fe_id || usedIds.has(fe_id))
                fe_id = nanoid_1.nanoid();
            usedIds.add(fe_id);
            var isHidden = typeof record.isHidden === 'boolean' ? record.isHidden : false;
            var isLocked = typeof record.isLocked === 'boolean' ? record.isLocked : false;
            return {
                fe_id: fe_id,
                type: type,
                title: title,
                isHidden: isHidden,
                isLocked: isLocked,
                props: props
            };
        })
            .filter(Boolean);
    };
    QuestionService.prototype.normalizeImportedQuestion = function (raw) {
        if (typeof raw !== 'object' || raw == null) {
            throw new common_1.BadRequestException('导入数据必须是对象');
        }
        var record = raw;
        // 兼容多种形态：
        // 1) { title, desc, js, css, isPublished, componentList, schemaVersion?... }
        // 2) { pageInfo: { ... }, componentList }
        var hasComponentList = Array.isArray(record.componentList);
        var hasPageInfo = typeof record.pageInfo === 'object' && record.pageInfo != null;
        var title = '';
        var desc = '';
        var js = '';
        var css = '';
        var isPublished = false;
        var componentList = [];
        if (hasComponentList && !hasPageInfo) {
            title = typeof record.title === 'string' ? record.title : '';
            desc = typeof record.desc === 'string' ? record.desc : '';
            js = typeof record.js === 'string' ? record.js : '';
            css = typeof record.css === 'string' ? record.css : '';
            isPublished =
                typeof record.isPublished === 'boolean' ? record.isPublished : false;
            componentList = this.sanitizeComponentList(record.componentList);
            return { title: title, desc: desc, js: js, css: css, isPublished: isPublished, componentList: componentList };
        }
        if (hasComponentList && hasPageInfo) {
            var pageInfo = record.pageInfo;
            title = typeof pageInfo.title === 'string' ? pageInfo.title : '';
            desc = typeof pageInfo.desc === 'string' ? pageInfo.desc : '';
            js = typeof pageInfo.js === 'string' ? pageInfo.js : '';
            css = typeof pageInfo.css === 'string' ? pageInfo.css : '';
            isPublished =
                typeof pageInfo.isPublished === 'boolean'
                    ? pageInfo.isPublished
                    : false;
            componentList = this.sanitizeComponentList(record.componentList);
            return { title: title, desc: desc, js: js, css: css, isPublished: isPublished, componentList: componentList };
        }
        throw new common_1.BadRequestException('文件内容不符合问卷格式');
    };
    QuestionService.prototype.exportQuestion = function (id, author) {
        return __awaiter(this, void 0, void 0, function () {
            var question, _a, title, _b, desc, _c, js, _d, css, _e, isPublished, _f, componentList, exportedComponentList;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        if (!mongoose_2["default"].Types.ObjectId.isValid(id)) {
                            throw new common_1.NotFoundException('问卷不存在');
                        }
                        return [4 /*yield*/, this.questionModel.findOne({ _id: id, author: author })];
                    case 1:
                        question = _g.sent();
                        if (!question)
                            throw new common_1.NotFoundException('问卷不存在');
                        _a = question.title, title = _a === void 0 ? '' : _a, _b = question.desc, desc = _b === void 0 ? '' : _b, _c = question.js, js = _c === void 0 ? '' : _c, _d = question.css, css = _d === void 0 ? '' : _d, _e = question.isPublished, isPublished = _e === void 0 ? false : _e, _f = question.componentList, componentList = _f === void 0 ? [] : _f;
                        exportedComponentList = componentList.map(function (c) {
                            var _a;
                            return ({
                                fe_id: c.fe_id,
                                type: c.type,
                                title: c.title,
                                isHidden: c.isHidden,
                                isLocked: c.isLocked,
                                props: (_a = c.props) !== null && _a !== void 0 ? _a : {}
                            });
                        });
                        return [2 /*return*/, {
                                schemaVersion: 1,
                                exportedAt: new Date().toISOString(),
                                app: 'question-server-nestjs',
                                title: title,
                                desc: desc,
                                js: js,
                                css: css,
                                isPublished: isPublished,
                                componentList: exportedComponentList
                            }];
                }
            });
        });
    };
    QuestionService.prototype.importQuestion = function (raw, author) {
        return __awaiter(this, void 0, Promise, function () {
            var normalized, newQuestion;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        normalized = this.normalizeImportedQuestion(raw);
                        newQuestion = new this.questionModel({
                            title: normalized.title || '未命名问卷',
                            desc: normalized.desc || '',
                            js: normalized.js || '',
                            css: normalized.css || '',
                            author: author,
                            isPublished: false,
                            isStar: false,
                            isDeleted: false,
                            componentList: normalized.componentList
                        });
                        return [4 /*yield*/, newQuestion.save()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    QuestionService.prototype.importIntoQuestion = function (id, raw, author) {
        return __awaiter(this, void 0, Promise, function () {
            var question, normalized, updatePayload, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!mongoose_2["default"].Types.ObjectId.isValid(id)) {
                            throw new common_1.NotFoundException('问卷不存在');
                        }
                        return [4 /*yield*/, this.questionModel.findOne({ _id: id, author: author })];
                    case 1:
                        question = _a.sent();
                        if (!question)
                            throw new common_1.NotFoundException('问卷不存在');
                        normalized = this.normalizeImportedQuestion(raw);
                        updatePayload = {
                            title: normalized.title || '未命名问卷',
                            desc: normalized.desc || '',
                            js: normalized.js || '',
                            css: normalized.css || '',
                            isPublished: normalized.isPublished,
                            componentList: normalized.componentList
                        };
                        return [4 /*yield*/, this.questionModel.updateOne({
                                _id: id,
                                author: author
                            }, updatePayload)];
                    case 2:
                        res = _a.sent();
                        return [2 /*return*/, {
                                acknowledged: res.acknowledged,
                                matchedCount: res.matchedCount,
                                modifiedCount: res.modifiedCount,
                                upsertedCount: res.upsertedCount,
                                upsertedId: res.upsertedId
                            }];
                }
            });
        });
    };
    QuestionService.prototype.findAllList = function (params) {
        return __awaiter(this, void 0, Promise, function () {
            var _a, keyword, _b, pageNum, _c, pageSize, _d, isDeleted, isStar, _e, author, matchStage, reg, result;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        console.log('findAllList params: ', params);
                        _a = params.keyword, keyword = _a === void 0 ? '' : _a, _b = params.pageNum, pageNum = _b === void 0 ? 1 : _b, _c = params.pageSize, pageSize = _c === void 0 ? 10 : _c, _d = params.isDeleted, isDeleted = _d === void 0 ? false : _d, isStar = params.isStar, _e = params.author, author = _e === void 0 ? '' : _e;
                        console.log('findAllList parsed params:');
                        console.log('  pageNum:', pageNum, typeof pageNum);
                        console.log('  pageSize:', pageSize, typeof pageSize);
                        console.log('  skip:', (pageNum - 1) * pageSize);
                        console.log('  limit:', pageSize);
                        matchStage = {
                            author: author,
                            isDeleted: isDeleted
                        };
                        if (isStar != null) {
                            matchStage.isStar = isStar;
                        }
                        if (keyword) {
                            reg = new RegExp(keyword, 'i');
                            matchStage.title = { $regex: reg }; // 标题模糊查询
                        }
                        return [4 /*yield*/, this.questionModel.aggregate([
                                // 过滤条件
                                { $match: matchStage },
                                // 联合Answer表
                                {
                                    $lookup: {
                                        from: 'answers',
                                        let: { questionId: '$_id' },
                                        pipeline: [
                                            {
                                                $match: {
                                                    $expr: {
                                                        $eq: [
                                                            { $toObjectId: '$questionId' },
                                                            '$$questionId',
                                                        ]
                                                    }
                                                }
                                            },
                                        ],
                                        as: 'answerList'
                                    }
                                },
                                // 添加answerCount字段，统计答卷数量
                                {
                                    $addFields: {
                                        answerCount: { $size: '$answerList' }
                                    }
                                },
                                // 移除不需要的answerList字段
                                { $project: { answerList: 0 } },
                                // 排序
                                { $sort: { _id: -1 } },
                                // 分页
                                { $skip: (pageNum - 1) * pageSize },
                                { $limit: pageSize },
                            ])];
                    case 1:
                        result = _f.sent();
                        console.log('findAllList result:');
                        console.log('  result length:', result.length);
                        console.log('  result:', result);
                        return [2 /*return*/, result];
                }
            });
        });
    };
    QuestionService.prototype.countAll = function (params) {
        return __awaiter(this, void 0, Promise, function () {
            var _a, keyword, _b, isDeleted, _c, author, isStar, whereOpt, reg;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = params.keyword, keyword = _a === void 0 ? '' : _a, _b = params.isDeleted, isDeleted = _b === void 0 ? false : _b, _c = params.author, author = _c === void 0 ? '' : _c, isStar = params.isStar;
                        whereOpt = {
                            author: author,
                            isDeleted: isDeleted
                        };
                        if (isStar != null) {
                            whereOpt.isStar = isStar;
                        }
                        if (keyword) {
                            reg = new RegExp(keyword, 'i');
                            whereOpt.title = { $regex: reg };
                        }
                        return [4 /*yield*/, this.questionModel.countDocuments(whereOpt)];
                    case 1: return [2 /*return*/, _d.sent()];
                }
            });
        });
    };
    QuestionService.prototype.deleteMany = function (ids, author) {
        return __awaiter(this, void 0, Promise, function () {
            var now, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = new Date();
                        return [4 /*yield*/, this.questionModel.updateMany({
                                _id: { $in: ids },
                                author: author
                            }, {
                                isDeleted: true,
                                deletedAt: now,
                                deletedBy: author,
                                deleteReason: ''
                            })];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, {
                                acknowledged: res.acknowledged,
                                deletedCount: res.modifiedCount
                            }];
                }
            });
        });
    };
    QuestionService.prototype.duplicate = function (id, author) {
        return __awaiter(this, void 0, Promise, function () {
            var question, _a, desc, _b, js, _c, css, _d, componentList, duplicatedComponentList, newQuestion;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!mongoose_2["default"].Types.ObjectId.isValid(id)) {
                            throw new common_1.NotFoundException('问卷不存在');
                        }
                        return [4 /*yield*/, this.questionModel.findById(id)];
                    case 1:
                        question = _e.sent();
                        if (!question) {
                            throw new common_1.NotFoundException('问卷不存在');
                        }
                        _a = question.desc, desc = _a === void 0 ? '' : _a, _b = question.js, js = _b === void 0 ? '' : _b, _c = question.css, css = _c === void 0 ? '' : _c, _d = question.componentList, componentList = _d === void 0 ? [] : _d;
                        duplicatedComponentList = componentList.map(function (c) {
                            var _a;
                            return ({
                                fe_id: nanoid_1.nanoid(),
                                type: c.type,
                                title: c.title,
                                isHidden: c.isHidden,
                                isLocked: c.isLocked,
                                props: (_a = c.props) !== null && _a !== void 0 ? _a : {}
                            });
                        });
                        newQuestion = new this.questionModel({
                            title: question.title + ' 副本',
                            desc: desc,
                            js: js,
                            css: css,
                            author: author,
                            isPublished: false,
                            isStar: false,
                            isDeleted: false,
                            componentList: duplicatedComponentList
                        });
                        return [4 /*yield*/, newQuestion.save()];
                    case 2: return [2 /*return*/, _e.sent()];
                }
            });
        });
    };
    /**
     * AI 生成问卷结构
     * 调用 AI 服务将自然语言描述转换为问卷数据结构
     */
    QuestionService.prototype.aiGenerateQuestion = function (prompt) {
        return __awaiter(this, void 0, void 0, function () {
            var aiResponse, sanitizedComponentList;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.aiService.generateQuestion({ prompt: prompt })];
                    case 1:
                        aiResponse = _a.sent();
                        sanitizedComponentList = aiResponse.componentList.map(function (component) { return (__assign(__assign({}, component), { fe_id: component.fe_id || nanoid_1.nanoid() })); });
                        // 返回标准化的问卷数据结构（对齐导入导出格式）
                        return [2 /*return*/, {
                                pageInfo: {
                                    title: aiResponse.pageInfo.title,
                                    desc: aiResponse.pageInfo.desc || '',
                                    js: aiResponse.pageInfo.js || '',
                                    css: aiResponse.pageInfo.css || '',
                                    isPublished: aiResponse.pageInfo.isPublished || false
                                },
                                componentList: sanitizedComponentList
                            }];
                }
            });
        });
    };
    QuestionService = __decorate([
        common_1.Injectable(),
        __param(0, mongoose_1.InjectModel(question_schema_1.Question.name)),
        __param(1, mongoose_1.InjectModel(question_review_schema_1.QuestionReview.name)),
        __param(2, mongoose_1.InjectModel(answer_schema_1.Answer.name))
    ], QuestionService);
    return QuestionService;
}());
exports.QuestionService = QuestionService;
