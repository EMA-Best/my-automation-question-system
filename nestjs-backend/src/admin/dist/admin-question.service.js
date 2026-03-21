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
exports.AdminQuestionService = void 0;
var common_1 = require("@nestjs/common");
var mongoose_1 = require("@nestjs/mongoose");
var mongoose_2 = require("mongoose");
var question_schema_1 = require("../question/schemas/question.schema");
var template_schema_1 = require("../template/schemas/template.schema");
var user_schema_1 = require("../user/schemas/user.schema");
var answer_schema_1 = require("../answer/schemas/answer.schema");
var question_review_schema_1 = require("../review/schemas/question-review.schema");
var AdminQuestionService = /** @class */ (function () {
    function AdminQuestionService(questionModel, userModel, answerModel, templateModel, questionReviewModel) {
        this.questionModel = questionModel;
        this.userModel = userModel;
        this.answerModel = answerModel;
        this.templateModel = templateModel;
        this.questionReviewModel = questionReviewModel;
    }
    AdminQuestionService.prototype.escapeRegex = function (input) {
        return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    AdminQuestionService.prototype.listDeleted = function (query) {
        var _a, _b, _c;
        return __awaiter(this, void 0, Promise, function () {
            var page, pageSize, baseMatch, deletedAt, d, d, buildRegex, keywordRegex, ownerRegex, deletedByRegex, deleteReasonRegex, keyword, pipeline, or, result, first;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        page = query.page && query.page > 0 ? query.page : 1;
                        pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 10;
                        baseMatch = {
                            isDeleted: true
                        };
                        if (query.deletedAtStart || query.deletedAtEnd) {
                            deletedAt = {};
                            if (query.deletedAtStart) {
                                d = new Date(query.deletedAtStart);
                                if (!Number.isNaN(d.getTime()))
                                    deletedAt.$gte = d;
                            }
                            if (query.deletedAtEnd) {
                                d = new Date(query.deletedAtEnd);
                                if (!Number.isNaN(d.getTime()))
                                    deletedAt.$lte = d;
                            }
                            if (Object.keys(deletedAt).length > 0)
                                baseMatch.deletedAt = deletedAt;
                        }
                        buildRegex = function (raw) {
                            var keyword = typeof raw === 'string' ? raw.trim() : '';
                            if (!keyword)
                                return null;
                            return new RegExp(_this.escapeRegex(keyword), 'i');
                        };
                        keywordRegex = buildRegex(query.keyword);
                        ownerRegex = buildRegex(query.ownerKeyword);
                        deletedByRegex = buildRegex(query.deletedByKeyword);
                        deleteReasonRegex = buildRegex(query.deleteReasonKeyword);
                        keyword = typeof query.keyword === 'string' ? query.keyword.trim() : '';
                        pipeline = [
                            { $match: baseMatch },
                            {
                                $lookup: {
                                    from: 'users',
                                    let: { author: '$author' },
                                    pipeline: [
                                        { $match: { $expr: { $eq: ['$username', '$$author'] } } },
                                        { $project: { _id: 0, username: 1, nickname: 1 } },
                                    ],
                                    as: 'owner'
                                }
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
                                                    ]
                                                }
                                            }
                                        },
                                        { $project: { _id: 0, username: 1, nickname: 1 } },
                                    ],
                                    as: 'deletedByUser'
                                }
                            },
                            { $unwind: { path: '$deletedByUser', preserveNullAndEmptyArrays: true } },
                        ];
                        if (keywordRegex) {
                            or = [{ title: keywordRegex }];
                            if (mongoose_2["default"].Types.ObjectId.isValid(keyword)) {
                                or.push({ _id: new mongoose_2["default"].Types.ObjectId(keyword) });
                            }
                            pipeline.push({ $match: { $or: or } });
                        }
                        if (ownerRegex) {
                            pipeline.push({
                                $match: {
                                    author: ownerRegex
                                }
                            });
                        }
                        if (deletedByRegex) {
                            pipeline.push({
                                $match: {
                                    $or: [
                                        { deletedBy: deletedByRegex },
                                        { 'deletedByUser.username': deletedByRegex },
                                        { 'deletedByUser.nickname': deletedByRegex },
                                    ]
                                }
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
                                as: 'answerAgg'
                            }
                        });
                        pipeline.push({
                            $addFields: {
                                answerCount: {
                                    $ifNull: [{ $arrayElemAt: ['$answerAgg.count', 0] }, 0]
                                }
                            }
                        });
                        pipeline.push({ $project: { answerAgg: 0 } });
                        pipeline.push({
                            $sort: {
                                deletedAt: -1,
                                _id: -1
                            }
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
                                            deletedBy: '$deletedByUser'
                                        }
                                    },
                                ],
                                count: [{ $count: 'count' }]
                            }
                        });
                        return [4 /*yield*/, this.questionModel.aggregate(pipeline)];
                    case 1:
                        result = _d.sent();
                        first = (_a = result[0]) !== null && _a !== void 0 ? _a : { list: [], count: [] };
                        return [2 /*return*/, {
                                list: first.list,
                                count: (_c = (_b = first.count[0]) === null || _b === void 0 ? void 0 : _b.count) !== null && _c !== void 0 ? _c : 0,
                                page: page,
                                pageSize: pageSize
                            }];
                }
            });
        });
    };
    AdminQuestionService.prototype.list = function (query) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function () {
            var page, pageSize, baseMatch, createdAt, d, d, keyword, regex, rawAuthorKeyword, authorRegex, pipeline, or, result, first;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        page = query.page && query.page > 0 ? query.page : 1;
                        pageSize = query.pageSize && query.pageSize > 0 ? query.pageSize : 10;
                        baseMatch = {};
                        // 默认只返回未删除数据；回收站页可显式传 isDeleted=true
                        if (query.isDeleted === 'true')
                            baseMatch.isDeleted = true;
                        else if (query.isDeleted === 'false')
                            baseMatch.isDeleted = false;
                        else
                            baseMatch.isDeleted = false;
                        if (query.isPublished === 'true')
                            baseMatch.isPublished = true;
                        if (query.isPublished === 'false')
                            baseMatch.isPublished = false;
                        if (typeof query.auditStatus === 'string' &&
                            ['Draft', 'PendingReview', 'Approved', 'Rejected'].includes(query.auditStatus)) {
                            baseMatch.auditStatus = query.auditStatus;
                        }
                        if (query.featured === 'true')
                            baseMatch.featured = true;
                        if (query.featured === 'false')
                            baseMatch.featured = false;
                        if (query.pinned === 'true')
                            baseMatch.pinned = true;
                        if (query.pinned === 'false')
                            baseMatch.pinned = false;
                        if (query.createdAtStart || query.createdAtEnd) {
                            createdAt = {};
                            if (query.createdAtStart) {
                                d = new Date(query.createdAtStart);
                                if (!Number.isNaN(d.getTime()))
                                    createdAt.$gte = d;
                            }
                            if (query.createdAtEnd) {
                                d = new Date(query.createdAtEnd);
                                if (!Number.isNaN(d.getTime()))
                                    createdAt.$lte = d;
                            }
                            if (Object.keys(createdAt).length > 0)
                                baseMatch.createdAt = createdAt;
                        }
                        keyword = typeof query.keyword === 'string' ? query.keyword.trim() : '';
                        regex = keyword
                            ? new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
                            : null;
                        rawAuthorKeyword = typeof query.author === 'string' && query.author.trim()
                            ? query.author.trim()
                            : typeof query.ownerKeyword === 'string' && query.ownerKeyword.trim()
                                ? query.ownerKeyword.trim()
                                : '';
                        authorRegex = rawAuthorKeyword
                            ? new RegExp(rawAuthorKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
                            : null;
                        pipeline = [
                            { $match: baseMatch },
                            {
                                $lookup: {
                                    from: 'users',
                                    let: { author: '$author' },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: { $eq: ['$username', '$$author'] }
                                            }
                                        },
                                        {
                                            $project: {
                                                _id: 0,
                                                username: 1,
                                                nickname: 1
                                            }
                                        },
                                    ],
                                    as: 'owner'
                                }
                            },
                            { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
                            {
                                $lookup: {
                                    from: 'templates',
                                    let: { qid: { $toString: '$_id' } },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: { $eq: ['$sourceQuestionId', '$$qid'] }
                                            }
                                        },
                                        { $project: { _id: 1 } },
                                        { $limit: 1 },
                                    ],
                                    as: 'linkedTemplates'
                                }
                            },
                            {
                                $addFields: {
                                    isTemplate: {
                                        $gt: [{ $size: '$linkedTemplates' }, 0]
                                    }
                                }
                            },
                            {
                                $project: {
                                    linkedTemplates: 0
                                }
                            },
                        ];
                        if (regex) {
                            or = [
                                { title: regex },
                                { author: regex },
                                { 'owner.nickname': regex },
                                { 'owner.username': regex },
                            ];
                            if (mongoose_2["default"].Types.ObjectId.isValid(keyword)) {
                                or.push({ _id: new mongoose_2["default"].Types.ObjectId(keyword) });
                            }
                            pipeline.push({ $match: { $or: or } });
                        }
                        if (authorRegex) {
                            pipeline.push({
                                $match: {
                                    $or: [
                                        { author: authorRegex },
                                        { 'owner.username': authorRegex },
                                        { 'owner.nickname': authorRegex },
                                    ]
                                }
                            });
                        }
                        pipeline.push({
                            $sort: {
                                pinned: -1,
                                pinnedAt: -1,
                                updatedAt: -1,
                                _id: -1
                            }
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
                                            isTemplate: 1,
                                            auditStatus: 1,
                                            auditReason: 1,
                                            auditUpdatedAt: 1,
                                            featured: 1,
                                            pinned: 1,
                                            pinnedAt: 1,
                                            createdAt: 1,
                                            updatedAt: 1,
                                            owner: 1
                                        }
                                    },
                                ],
                                count: [{ $count: 'count' }]
                            }
                        });
                        return [4 /*yield*/, this.questionModel.aggregate(pipeline)];
                    case 1:
                        result = _d.sent();
                        first = (_a = result[0]) !== null && _a !== void 0 ? _a : { list: [], count: [] };
                        return [2 /*return*/, {
                                list: first.list,
                                count: (_c = (_b = first.count[0]) === null || _b === void 0 ? void 0 : _b.count) !== null && _c !== void 0 ? _c : 0,
                                page: page,
                                pageSize: pageSize
                            }];
                }
            });
        });
    };
    AdminQuestionService.prototype.restore = function (id, restoredBy) {
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
                        if (!question)
                            throw new common_1.NotFoundException('问卷不存在');
                        if (!question.isDeleted) {
                            throw new common_1.BadRequestException('问卷未删除，无需恢复');
                        }
                        question.isDeleted = false;
                        question.restoredAt = new Date();
                        question.restoredBy = restoredBy;
                        return [4 /*yield*/, question.save()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, { ok: true }];
                }
            });
        });
    };
    AdminQuestionService.prototype.softDelete = function (id, operatorId, reason) {
        return __awaiter(this, void 0, Promise, function () {
            var question, trimmedReason;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!mongoose_2["default"].Types.ObjectId.isValid(id)) {
                            throw new common_1.NotFoundException('问卷不存在');
                        }
                        return [4 /*yield*/, this.questionModel.findById(id)];
                    case 1:
                        question = _a.sent();
                        if (!question)
                            throw new common_1.NotFoundException('问卷不存在');
                        if (question.isDeleted) {
                            throw new common_1.BadRequestException('问卷已在回收站');
                        }
                        trimmedReason = typeof reason === 'string' ? reason.trim() : '';
                        if (!trimmedReason) {
                            throw new common_1.BadRequestException('reason 不能为空');
                        }
                        question.isDeleted = true;
                        question.deletedAt = new Date();
                        question.deletedBy = operatorId;
                        question.deleteReason = trimmedReason;
                        return [4 /*yield*/, question.save()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, { ok: true }];
                }
            });
        });
    };
    AdminQuestionService.prototype.permanentDelete = function (id, operator) {
        var _a, _b, _c;
        return __awaiter(this, void 0, Promise, function () {
            var question, answersRes, reviewsRes, questionRes;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!mongoose_2["default"].Types.ObjectId.isValid(id)) {
                            throw new common_1.NotFoundException('问卷不存在');
                        }
                        return [4 /*yield*/, this.questionModel.findById(id)];
                    case 1:
                        question = _d.sent();
                        if (!question)
                            throw new common_1.NotFoundException('问卷不存在');
                        if (!question.isDeleted) {
                            throw new common_1.BadRequestException('仅支持对已删除问卷执行永久删除');
                        }
                        return [4 /*yield*/, this.answerModel.deleteMany({ questionId: id })];
                    case 2:
                        answersRes = _d.sent();
                        return [4 /*yield*/, this.questionReviewModel.deleteMany({
                                questionId: new mongoose_2["default"].Types.ObjectId(id)
                            })];
                    case 3:
                        reviewsRes = _d.sent();
                        return [4 /*yield*/, this.questionModel.deleteOne({ _id: id })];
                    case 4:
                        questionRes = _d.sent();
                        return [2 /*return*/, {
                                ok: true,
                                operator: operator,
                                deleted: {
                                    question: (_a = questionRes.deletedCount) !== null && _a !== void 0 ? _a : 0,
                                    answers: (_b = answersRes.deletedCount) !== null && _b !== void 0 ? _b : 0,
                                    reviews: (_c = reviewsRes.deletedCount) !== null && _c !== void 0 ? _c : 0
                                }
                            }];
                }
            });
        });
    };
    AdminQuestionService.prototype.detail = function (id) {
        return __awaiter(this, void 0, Promise, function () {
            var question, owner;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!mongoose_2["default"].Types.ObjectId.isValid(id)) {
                            throw new common_1.NotFoundException('问卷不存在');
                        }
                        return [4 /*yield*/, this.questionModel
                                .findById(id)
                                .lean()];
                    case 1:
                        question = _a.sent();
                        if (!question)
                            throw new common_1.NotFoundException('问卷不存在');
                        return [4 /*yield*/, this.userModel
                                .findOne({ username: question.author })
                                .select({ username: 1, nickname: 1, _id: 0 })
                                .lean()];
                    case 2:
                        owner = _a.sent();
                        return [2 /*return*/, __assign(__assign({}, question), { owner: owner !== null && owner !== void 0 ? owner : null })];
                }
            });
        });
    };
    AdminQuestionService.prototype.unpublish = function (id) {
        return __awaiter(this, void 0, void 0, function () {
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
                        if (!question)
                            throw new common_1.NotFoundException('问卷不存在');
                        question.isPublished = false;
                        question.pinned = false;
                        question.featured = false;
                        question.pinnedAt = null;
                        return [4 /*yield*/, question.save()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, { ok: true }];
                }
            });
        });
    };
    AdminQuestionService.prototype.publish = function (id) {
        return __awaiter(this, void 0, void 0, function () {
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
                        if (!question)
                            throw new common_1.NotFoundException('问卷不存在');
                        if (question.isDeleted) {
                            throw new common_1.BadRequestException('问卷已删除，无法发布');
                        }
                        if (question.auditStatus !== 'Approved') {
                            throw new common_1.BadRequestException('问卷未审核通过，无法发布');
                        }
                        question.isPublished = true;
                        return [4 /*yield*/, question.save()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, { ok: true }];
                }
            });
        });
    };
    AdminQuestionService.prototype.feature = function (id, payload) {
        return __awaiter(this, void 0, void 0, function () {
            var question;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!mongoose_2["default"].Types.ObjectId.isValid(id)) {
                            throw new common_1.NotFoundException('问卷不存在');
                        }
                        if (payload.featured == null && payload.pinned == null) {
                            throw new common_1.BadRequestException('featured 或 pinned 至少传一个');
                        }
                        return [4 /*yield*/, this.questionModel.findById(id)];
                    case 1:
                        question = _a.sent();
                        if (!question)
                            throw new common_1.NotFoundException('问卷不存在');
                        if (!question.isPublished) {
                            throw new common_1.BadRequestException('未发布问卷不支持置顶/推荐');
                        }
                        if (typeof payload.featured === 'boolean') {
                            question.featured = payload.featured;
                        }
                        if (typeof payload.pinned === 'boolean') {
                            question.pinned = payload.pinned;
                            question.pinnedAt = payload.pinned ? new Date() : null;
                        }
                        return [4 /*yield*/, question.save()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, { ok: true }];
                }
            });
        });
    };
    AdminQuestionService = __decorate([
        common_1.Injectable(),
        __param(0, mongoose_1.InjectModel(question_schema_1.Question.name)),
        __param(1, mongoose_1.InjectModel(user_schema_1.User.name)),
        __param(2, mongoose_1.InjectModel(answer_schema_1.Answer.name)),
        __param(3, mongoose_1.InjectModel(template_schema_1.Template.name)),
        __param(4, mongoose_1.InjectModel(question_review_schema_1.QuestionReview.name))
    ], AdminQuestionService);
    return AdminQuestionService;
}());
exports.AdminQuestionService = AdminQuestionService;
