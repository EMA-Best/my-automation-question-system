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
exports.StatReportService = void 0;
var common_1 = require("@nestjs/common");
var mongoose_1 = require("@nestjs/mongoose");
var ai_report_schema_1 = require("./schemas/ai-report.schema");
var question_schema_1 = require("../question/schemas/question.schema");
var answer_schema_1 = require("../answer/schemas/answer.schema");
var StatReportService = /** @class */ (function () {
    function StatReportService(aiReportModel, questionModel, answerModel, aiService, statService) {
        this.aiReportModel = aiReportModel;
        this.questionModel = questionModel;
        this.answerModel = answerModel;
        this.aiService = aiService;
        this.statService = statService;
    }
    // 获取最新 AI 报告
    StatReportService.prototype.getLatestReport = function (questionId) {
        return __awaiter(this, void 0, void 0, function () {
            var report;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.aiReportModel
                            .findOne({ questionId: questionId, status: 'succeeded' })
                            .sort({ createdAt: -1 })
                            .exec()];
                    case 1:
                        report = _a.sent();
                        if (!report) {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, report.report];
                }
            });
        });
    };
    // 获取任务状态
    StatReportService.prototype.getTaskStatus = function (questionId, taskId) {
        return __awaiter(this, void 0, void 0, function () {
            var task, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        task = null;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.aiReportModel
                                .findOne({ _id: taskId, questionId: questionId })
                                .exec()];
                    case 2:
                        task = _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        throw new common_1.NotFoundException('任务不存在');
                    case 4:
                        if (!task) {
                            throw new common_1.NotFoundException('任务不存在');
                        }
                        return [2 /*return*/, {
                                taskId: taskId,
                                status: task.status,
                                errorMessage: task.errorMessage || null,
                                report: task.status === 'succeeded' ? task.report : null,
                                createdAt: task.createdAt,
                                updatedAt: task.updatedAt
                            }];
                }
            });
        });
    };
    // 生成 AI 报告
    StatReportService.prototype.generateReport = function (questionId, payload) {
        return __awaiter(this, void 0, void 0, function () {
            var normalizedPayload, question, task, taskId;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        normalizedPayload = this.normalizePayload(payload);
                        return [4 /*yield*/, this.questionModel.findById(questionId).exec()];
                    case 1:
                        question = _a.sent();
                        if (!question) {
                            throw new common_1.NotFoundException('问卷不存在');
                        }
                        if (!question.isPublished) {
                            throw new common_1.BadRequestException('问卷未发布，无法生成报告');
                        }
                        return [4 /*yield*/, this.aiReportModel.create({
                                questionId: questionId,
                                questionTitle: question.title,
                                status: 'pending',
                                answerCount: 0,
                                validAnswerCount: 0,
                                filters: normalizedPayload,
                                report: this.createEmptyReport(),
                                modelInfo: {
                                    provider: 'deepseek',
                                    model: 'deepseek-chat',
                                    temperature: 0.3,
                                    generatedAt: new Date()
                                },
                                errorMessage: '',
                                createdBy: 'system'
                            })];
                    case 2:
                        task = _a.sent();
                        taskId = task._id.toString();
                        // 异步执行，接口立即返回 taskId
                        setTimeout(function () {
                            void _this.executeReportTask(taskId, questionId, normalizedPayload);
                        }, 0);
                        return [2 /*return*/, {
                                taskId: taskId,
                                status: 'pending'
                            }];
                }
            });
        });
    };
    StatReportService.prototype.executeReportTask = function (taskId, questionId, payload) {
        return __awaiter(this, void 0, void 0, function () {
            var question, answers, aggregatedData, prompt, aiResponse, reportData, error_1, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 9]);
                        return [4 /*yield*/, this.aiReportModel.findByIdAndUpdate(taskId, {
                                status: 'processing',
                                errorMessage: ''
                            })];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.questionModel.findById(questionId).exec()];
                    case 2:
                        question = _a.sent();
                        if (!question) {
                            throw new common_1.NotFoundException('问卷不存在');
                        }
                        if (!question.isPublished) {
                            throw new common_1.BadRequestException('问卷未发布，无法生成报告');
                        }
                        return [4 /*yield*/, this.getAnswers(questionId, payload)];
                    case 3:
                        answers = _a.sent();
                        if (answers.length === 0) {
                            throw new common_1.BadRequestException('暂无答卷数据，无法生成报告');
                        }
                        return [4 /*yield*/, this.aggregateData(question, answers)];
                    case 4:
                        aggregatedData = _a.sent();
                        prompt = this.buildPrompt(aggregatedData);
                        return [4 /*yield*/, this.aiService.generateContent({
                                model: 'deepseek-chat',
                                messages: [
                                    {
                                        role: 'system',
                                        content: '你是一个专业的数据分析助手，负责分析问卷数据并生成结构化的分析报告。'
                                    },
                                    {
                                        role: 'user',
                                        content: prompt
                                    },
                                ],
                                max_tokens: this.resolveMaxTokens(payload),
                                temperature: 0.3
                            })];
                    case 5:
                        aiResponse = _a.sent();
                        reportData = this.parseAIResponse(aiResponse, aggregatedData);
                        return [4 /*yield*/, this.aiReportModel.findByIdAndUpdate(taskId, {
                                status: 'succeeded',
                                questionTitle: question.title,
                                answerCount: answers.length,
                                validAnswerCount: answers.length,
                                filters: payload,
                                report: reportData,
                                modelInfo: {
                                    provider: 'deepseek',
                                    model: 'deepseek-chat',
                                    temperature: 0.3,
                                    generatedAt: new Date()
                                },
                                errorMessage: ''
                            })];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 7:
                        error_1 = _a.sent();
                        errorMessage = this.getErrorMessage(error_1);
                        return [4 /*yield*/, this.aiReportModel.findByIdAndUpdate(taskId, {
                                status: 'failed',
                                errorMessage: errorMessage
                            })];
                    case 8:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    // 重新生成 AI 报告
    StatReportService.prototype.regenerateReport = function (questionId, payload) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.generateReport(questionId, payload)];
            });
        });
    };
    StatReportService.prototype.normalizePayload = function (payload) {
        var _a;
        return {
            mode: (payload === null || payload === void 0 ? void 0 : payload.mode) || 'standard',
            timeRange: (payload === null || payload === void 0 ? void 0 : payload.timeRange) || 'all',
            includeTextAnswers: (_a = payload === null || payload === void 0 ? void 0 : payload.includeTextAnswers) !== null && _a !== void 0 ? _a : true,
            maxAnswers: payload === null || payload === void 0 ? void 0 : payload.maxAnswers
        };
    };
    StatReportService.prototype.createEmptyReport = function () {
        return {
            summary: { headline: '', brief: '' },
            highlights: [],
            sampleOverview: {
                totalAnswers: 0,
                validAnswers: 0,
                textCoverage: 0
            },
            questionInsights: [],
            risks: [],
            recommendations: [],
            confidenceNotes: []
        };
    };
    StatReportService.prototype.getErrorMessage = function (error) {
        if (error instanceof common_1.BadRequestException ||
            error instanceof common_1.NotFoundException) {
            var response = error.getResponse();
            if (typeof response === 'string')
                return response;
            if (response && typeof response === 'object') {
                var msg = response.message;
                if (typeof msg === 'string')
                    return msg;
                if (Array.isArray(msg) && typeof msg[0] === 'string')
                    return msg[0];
            }
            return error.message;
        }
        if (error instanceof Error)
            return error.message;
        return '生成报告时发生未知错误';
    };
    // 按条件获取答卷
    StatReportService.prototype.getAnswers = function (questionId, payload) {
        return __awaiter(this, void 0, void 0, function () {
            var query, now, startDate, limit;
            return __generator(this, function (_a) {
                query = { questionId: questionId };
                // 时间范围过滤
                if (payload.timeRange && payload.timeRange !== 'all') {
                    now = new Date();
                    startDate = void 0;
                    if (payload.timeRange === '7d') {
                        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    }
                    else if (payload.timeRange === '30d') {
                        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    }
                    if (startDate) {
                        query.createdAt = { $gte: startDate };
                    }
                }
                limit = this.resolveMaxAnswers(payload);
                return [2 /*return*/, this.answerModel.find(query).limit(limit).exec()];
            });
        });
    };
    StatReportService.prototype.resolveMaxAnswers = function (payload) {
        var mode = payload.mode || 'standard';
        var modeDefault = mode === 'quick' ? 80 : mode === 'deep' ? 300 : 180;
        var requestLimit = typeof payload.maxAnswers === 'number' && payload.maxAnswers > 0
            ? payload.maxAnswers
            : modeDefault;
        return Math.min(requestLimit, 300);
    };
    StatReportService.prototype.resolveMaxTokens = function (payload) {
        var mode = payload.mode || 'standard';
        if (mode === 'quick')
            return 1000;
        if (mode === 'deep')
            return 1800;
        return 1400;
    };
    // 数据聚合与脱敏
    StatReportService.prototype.aggregateData = function (question, answers) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var aggregated, _loop_1, this_1, _i, _c, component;
            return __generator(this, function (_d) {
                aggregated = {
                    questionTitle: question.title,
                    questionCount: question.componentList.length,
                    answerCount: answers.length,
                    questions: []
                };
                _loop_1 = function (component) {
                    var textTypes = new Set(['questionInput', 'questionTextarea', 'text']);
                    var singleChoiceTypes = new Set([
                        'questionRadio',
                        'questionSelect',
                        'radio',
                        'select',
                    ]);
                    var multiChoiceTypes = new Set(['questionCheckbox', 'checkbox']);
                    var questionData = {
                        id: component.fe_id,
                        title: component.title,
                        type: component.type,
                        options: ((_a = component.props) === null || _a === void 0 ? void 0 : _a.options) || [],
                        answers: []
                    };
                    // 收集该题目的所有回答
                    for (var _i = 0, answers_1 = answers; _i < answers_1.length; _i++) {
                        var answer = answers_1[_i];
                        // 检查 answerList 结构
                        if (answer.answerList && Array.isArray(answer.answerList)) {
                            // 处理标准 answerList 结构
                            var answerItem = answer.answerList.find(function (item) {
                                var curComponentId = item.componentFeId ||
                                    item.fe_id ||
                                    item.componentId ||
                                    item.id ||
                                    '';
                                return curComponentId === component.fe_id;
                            });
                            if (answerItem) {
                                var value = answerItem.value;
                                if (!Array.isArray(value)) {
                                    value = [value];
                                }
                                // 脱敏处理
                                if (textTypes.has(component.type) &&
                                    Array.isArray(value) &&
                                    value.length > 0 &&
                                    typeof value[0] === 'string') {
                                    value = [this_1.desensitizeText(value[0])];
                                }
                                questionData.answers.push(value);
                            }
                        }
                        else {
                            // 处理直接键值对结构
                            var answerValue = answer[component.fe_id];
                            if (answerValue !== undefined) {
                                var value = answerValue;
                                // 确保 value 是数组格式
                                if (!Array.isArray(value)) {
                                    value = [value];
                                }
                                // 脱敏处理
                                if (textTypes.has(component.type) &&
                                    value.length > 0 &&
                                    typeof value[0] === 'string') {
                                    value = [this_1.desensitizeText(value[0])];
                                }
                                questionData.answers.push(value);
                            }
                        }
                    }
                    // 统计选项分布
                    if ((singleChoiceTypes.has(component.type) ||
                        multiChoiceTypes.has(component.type)) && ((_b = component.props) === null || _b === void 0 ? void 0 : _b.options) &&
                        Array.isArray(component.props.options)) {
                        questionData.optionStats = component.props.options.map(function (option) { return ({
                            label: option.label,
                            value: option.value,
                            count: questionData.answers.filter(function (v) {
                                return (multiChoiceTypes.has(component.type) &&
                                    Array.isArray(v) &&
                                    v.includes(option.value)) ||
                                    (singleChoiceTypes.has(component.type) &&
                                        Array.isArray(v) &&
                                        v[0] === option.value);
                            }).length
                        }); });
                    }
                    aggregated.questions.push(questionData);
                };
                this_1 = this;
                // 按题目聚合数据
                for (_i = 0, _c = question.componentList; _i < _c.length; _i++) {
                    component = _c[_i];
                    _loop_1(component);
                }
                return [2 /*return*/, aggregated];
            });
        });
    };
    // 脱敏处理
    StatReportService.prototype.desensitizeText = function (text) {
        // 简单脱敏：替换邮箱、手机号等
        text = text.replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '[邮箱]');
        text = text.replace(/\b1[3-9]\d{9}\b/g, '[手机号]');
        text = text.replace(/\b\d{18}\b/g, '[身份证]');
        return text;
    };
    // 构建分析 prompt
    StatReportService.prototype.buildPrompt = function (aggregatedData) {
        var promptData = this.buildPromptData(aggregatedData);
        return "\u8BF7\u57FA\u4E8E\u4EE5\u4E0B\u95EE\u5377\u6570\u636E\u751F\u6210\u4E00\u4EFD\u7ED3\u6784\u5316\u7684 AI \u5206\u6790\u62A5\u544A\uFF1A\n\n\u95EE\u5377\u4FE1\u606F\uFF1A\n- \u6807\u9898\uFF1A" + aggregatedData.questionTitle + "\n- \u9898\u76EE\u6570\u91CF\uFF1A" + aggregatedData.questionCount + "\n- \u7B54\u5377\u6570\u91CF\uFF1A" + aggregatedData.answerCount + "\n\n\u6570\u636E\u8BE6\u60C5\uFF1A\n" + JSON.stringify(promptData, null, 2) + "\n\n\u62A5\u544A\u8981\u6C42\uFF1A\n1. \u5FC5\u987B\u8FD4\u56DE JSON \u683C\u5F0F\uFF0C\u4E0D\u8981\u5305\u542B Markdown\n2. \u62A5\u544A\u5E94\u5305\u542B\uFF1A\u6267\u884C\u6458\u8981\u3001\u5173\u952E\u53D1\u73B0\u3001\u6837\u672C\u6982\u89C8\u3001\u9898\u76EE\u6D1E\u5BDF\u3001\u98CE\u9669\u63D0\u793A\u3001\u884C\u52A8\u5EFA\u8BAE\n3. \u6BCF\u6761\u5173\u952E\u53D1\u73B0\u5FC5\u987B\u9644\u5E26\u4F9D\u636E\uFF08\u9898\u76EE ID\uFF09\n4. \u7ED3\u8BBA\u4EC5\u57FA\u4E8E\u8F93\u5165\u6570\u636E\uFF0C\u4E0D\u5F97\u81C6\u6D4B\n5. \u82E5\u6837\u672C\u4E0D\u8DB3\uFF0C\u5FC5\u987B\u8F93\u51FA\u98CE\u9669\u63D0\u793A\n\n\u8F93\u51FA\u683C\u5F0F\u793A\u4F8B\uFF1A\n{\n  \"summary\": {\n    \"headline\": \"\u6267\u884C\u6458\u8981\u6807\u9898\",\n    \"brief\": \"\u6267\u884C\u6458\u8981\u5185\u5BB9\"\n  },\n  \"highlights\": [\n    {\n      \"title\": \"\u5173\u952E\u53D1\u73B0 1\",\n      \"detail\": \"\u53D1\u73B0\u8BE6\u60C5\",\n      \"evidenceQuestionIds\": [\"q1\"]\n    }\n  ],\n  \"sampleOverview\": {\n    \"totalAnswers\": 100,\n    \"validAnswers\": 100,\n    \"textCoverage\": 80\n  },\n  \"questionInsights\": [\n    {\n      \"questionId\": \"q1\",\n      \"questionTitle\": \"\u95EE\u9898\u6807\u9898\",\n      \"questionType\": \"radio\",\n      \"finding\": \"\u53D1\u73B0\u5185\u5BB9\",\n      \"evidence\": \"\u4F9D\u636E\u5185\u5BB9\",\n      \"chartHint\": \"\u56FE\u8868\u63D0\u793A\"\n    }\n  ],\n  \"risks\": [\"\u98CE\u9669 1\", \"\u98CE\u9669 2\"],\n  \"recommendations\": [\"\u5EFA\u8BAE 1\", \"\u5EFA\u8BAE 2\"],\n  \"confidenceNotes\": [\"\u7F6E\u4FE1\u5EA6\u8BF4\u660E\"]\n}";
    };
    StatReportService.prototype.buildPromptData = function (aggregatedData) {
        var textTypes = new Set(['questionInput', 'questionTextarea', 'text']);
        return {
            questionTitle: aggregatedData.questionTitle,
            questionCount: aggregatedData.questionCount,
            answerCount: aggregatedData.answerCount,
            questions: (aggregatedData.questions || []).map(function (q) {
                var sampleAnswers = (q.answers || []).slice(0, 20).map(function (ans) {
                    if (!Array.isArray(ans))
                        return ans;
                    if (!textTypes.has(q.type))
                        return ans;
                    return ans.map(function (item) {
                        if (typeof item !== 'string')
                            return item;
                        return item.length > 80 ? item.slice(0, 80) + "..." : item;
                    });
                });
                return {
                    id: q.id,
                    title: q.title,
                    type: q.type,
                    answerCount: Array.isArray(q.answers) ? q.answers.length : 0,
                    optionStats: q.optionStats || [],
                    sampleAnswers: sampleAnswers
                };
            })
        };
    };
    // 解析 AI 输出
    StatReportService.prototype.parseAIResponse = function (response, aggregatedData) {
        var rawContent = this.extractAIContent(response);
        var parsed = this.tryParseJsonObject(rawContent);
        if (parsed) {
            return this.normalizeReport(parsed);
        }
        // 解析失败时降级，避免前端直接报错
        return this.buildFallbackReport(aggregatedData, rawContent);
    };
    StatReportService.prototype.extractAIContent = function (response) {
        var _a, _b, _c;
        var content = (_c = (_b = (_a = response === null || response === void 0 ? void 0 : response.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content;
        if (typeof content === 'string')
            return content;
        // 兼容部分 OpenAI-compatible 返回数组块内容
        if (Array.isArray(content)) {
            return content
                .map(function (item) {
                if (typeof item === 'string')
                    return item;
                if (typeof (item === null || item === void 0 ? void 0 : item.text) === 'string')
                    return item.text;
                return '';
            })
                .join('')
                .trim();
        }
        return '';
    };
    StatReportService.prototype.tryParseJsonObject = function (raw) {
        var base = (raw || '').replace(/\uFEFF/g, '').trim();
        if (!base)
            return null;
        var candidates = [];
        candidates.push(base);
        var noFence = base
            .replace(/```json/gi, '```')
            .replace(/```/g, '')
            .trim();
        if (noFence && noFence !== base)
            candidates.push(noFence);
        var fencedMatch = base.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fencedMatch === null || fencedMatch === void 0 ? void 0 : fencedMatch[1]) {
            candidates.push(fencedMatch[1].trim());
        }
        var firstJsonBlock = this.extractFirstJsonObject(noFence || base);
        if (firstJsonBlock)
            candidates.push(firstJsonBlock);
        for (var _i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {
            var candidate = candidates_1[_i];
            var parsed = this.parseAsObject(candidate);
            if (parsed)
                return parsed;
        }
        return null;
    };
    StatReportService.prototype.extractFirstJsonObject = function (text) {
        var start = text.indexOf('{');
        if (start < 0)
            return null;
        var depth = 0;
        var inString = false;
        var escaped = false;
        for (var i = start; i < text.length; i++) {
            var ch = text[i];
            if (inString) {
                if (escaped) {
                    escaped = false;
                }
                else if (ch === '\\') {
                    escaped = true;
                }
                else if (ch === '"') {
                    inString = false;
                }
                continue;
            }
            if (ch === '"') {
                inString = true;
                continue;
            }
            if (ch === '{')
                depth++;
            if (ch === '}') {
                depth--;
                if (depth === 0) {
                    return text.slice(start, i + 1);
                }
            }
        }
        return null;
    };
    StatReportService.prototype.parseAsObject = function (jsonText) {
        var trimmed = (jsonText || '').trim();
        if (!trimmed)
            return null;
        var attempts = [trimmed, trimmed.replace(/,\s*([}\]])/g, '$1')];
        for (var _i = 0, attempts_1 = attempts; _i < attempts_1.length; _i++) {
            var text = attempts_1[_i];
            try {
                var parsed = JSON.parse(text);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    return parsed;
                }
            }
            catch (_a) {
                // continue
            }
        }
        return null;
    };
    StatReportService.prototype.normalizeReport = function (report) {
        var source = report.report && typeof report.report === 'object'
            ? report.report
            : report;
        return {
            summary: source.summary || { headline: '', brief: '' },
            highlights: Array.isArray(source.highlights) ? source.highlights : [],
            sampleOverview: source.sampleOverview || {
                totalAnswers: 0,
                validAnswers: 0,
                textCoverage: 0
            },
            questionInsights: Array.isArray(source.questionInsights)
                ? source.questionInsights
                : [],
            risks: Array.isArray(source.risks) ? source.risks : [],
            recommendations: Array.isArray(source.recommendations)
                ? source.recommendations
                : [],
            confidenceNotes: Array.isArray(source.confidenceNotes)
                ? source.confidenceNotes
                : []
        };
    };
    StatReportService.prototype.buildFallbackReport = function (aggregatedData, rawContent) {
        var totalAnswers = (aggregatedData === null || aggregatedData === void 0 ? void 0 : aggregatedData.answerCount) || 0;
        var questionCount = (aggregatedData === null || aggregatedData === void 0 ? void 0 : aggregatedData.questionCount) || 0;
        return {
            summary: {
                headline: 'AI 报告已降级生成',
                brief: '本次 AI 返回内容不是标准 JSON，系统已自动降级为基础统计报告。建议稍后重试或切换 quick 模式。'
            },
            highlights: [
                {
                    title: '基础样本统计',
                    detail: "\u5F53\u524D\u5171 " + totalAnswers + " \u4EFD\u7B54\u5377\uFF0C\u8986\u76D6 " + questionCount + " \u9053\u9898\u3002",
                    evidenceQuestionIds: []
                },
            ],
            sampleOverview: {
                totalAnswers: totalAnswers,
                validAnswers: totalAnswers,
                textCoverage: 0
            },
            questionInsights: [],
            risks: ['AI 原始返回不是标准 JSON，结果已降级。'],
            recommendations: [
                '稍后重试生成',
                '优先使用 quick 模式',
                '必要时缩小 maxAnswers',
            ],
            confidenceNotes: rawContent
                ? ["\u539F\u59CB\u8F93\u51FA\u957F\u5EA6\uFF1A" + rawContent.length]
                : ['未获取到可解析的 AI 输出']
        };
    };
    StatReportService = __decorate([
        common_1.Injectable(),
        __param(0, mongoose_1.InjectModel(ai_report_schema_1.AIReport.name)),
        __param(1, mongoose_1.InjectModel(question_schema_1.Question.name)),
        __param(2, mongoose_1.InjectModel(answer_schema_1.Answer.name))
    ], StatReportService);
    return StatReportService;
}());
exports.StatReportService = StatReportService;
