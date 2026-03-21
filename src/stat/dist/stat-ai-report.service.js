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
exports.StatAIReportService = void 0;
var common_1 = require("@nestjs/common");
var mongoose_1 = require("@nestjs/mongoose");
var answer_schema_1 = require("src/answer/schemas/answer.schema");
var openai_compatible_provider_1 = require("src/ai/providers/openai-compatible.provider");
var question_schema_1 = require("src/question/schemas/question.schema");
var ai_analysis_report_schema_1 = require("./schemas/ai-analysis-report.schema");
var StatAIReportService = /** @class */ (function () {
    function StatAIReportService(aiConfigService, questionModel, answerModel, reportModel) {
        this.aiConfigService = aiConfigService;
        this.questionModel = questionModel;
        this.answerModel = answerModel;
        this.reportModel = reportModel;
        this.aiConfig = this.aiConfigService.getConfig();
        var providerConfig = {
            apiKey: this.aiConfig.apiKey,
            baseUrl: this.aiConfig.baseUrl,
            chatCompletionsPath: this.aiConfig.chatCompletionsPath,
            timeoutMs: this.aiConfig.timeoutMs
        };
        this.provider = new openai_compatible_provider_1.OpenAICompatibleProvider(providerConfig);
    }
    StatAIReportService.prototype.getLatestReport = function (questionId) {
        return __awaiter(this, void 0, void 0, function () {
            var doc;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.reportModel
                            .findOne({ questionId: questionId, status: 'succeeded' })
                            .sort({ createdAt: -1 })
                            .lean()];
                    case 1:
                        doc = _a.sent();
                        if (!doc)
                            return [2 /*return*/, null];
                        return [2 /*return*/, this.toReportResponse(doc)];
                }
            });
        });
    };
    StatAIReportService.prototype.generateReport = function (questionId, dto, createdBy) {
        var _a, _b;
        if (createdBy === void 0) { createdBy = 'system'; }
        return __awaiter(this, void 0, void 0, function () {
            var question, filters, answers, dataset, creating, report, e_1, errorMessage, latest;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.questionModel.findById(questionId).lean()];
                    case 1:
                        question = _c.sent();
                        if (!question) {
                            throw new common_1.NotFoundException('问卷不存在');
                        }
                        filters = this.buildFilters(dto);
                        return [4 /*yield*/, this.answerModel
                                .find({ questionId: questionId })
                                .sort({ _id: -1 })
                                .limit(filters.maxAnswers)
                                .lean()];
                    case 2:
                        answers = _c.sent();
                        dataset = this.buildDataset(question, answers, filters);
                        return [4 /*yield*/, this.reportModel.create({
                                questionId: questionId,
                                questionTitle: (_a = question.title) !== null && _a !== void 0 ? _a : '',
                                status: 'processing',
                                answerCount: dataset.totalAnswers,
                                validAnswerCount: dataset.validAnswers,
                                filters: filters,
                                report: null,
                                modelInfo: {
                                    provider: this.aiConfig.provider,
                                    model: this.aiConfig.model,
                                    temperature: this.aiConfig.temperature
                                },
                                createdBy: createdBy
                            })];
                    case 3:
                        creating = _c.sent();
                        _c.label = 4;
                    case 4:
                        _c.trys.push([4, 7, , 9]);
                        return [4 /*yield*/, this.callAIForReport((_b = question.title) !== null && _b !== void 0 ? _b : '未命名问卷', dataset)];
                    case 5:
                        report = _c.sent();
                        return [4 /*yield*/, this.reportModel.updateOne({ _id: creating._id }, {
                                $set: {
                                    status: 'succeeded',
                                    report: report,
                                    errorMessage: '',
                                    modelInfo: {
                                        provider: this.aiConfig.provider,
                                        model: this.aiConfig.model,
                                        temperature: this.aiConfig.temperature,
                                        generatedAt: new Date().toISOString()
                                    }
                                }
                            })];
                    case 6:
                        _c.sent();
                        return [3 /*break*/, 9];
                    case 7:
                        e_1 = _c.sent();
                        errorMessage = e_1 instanceof Error ? e_1.message : '未知错误';
                        return [4 /*yield*/, this.reportModel.updateOne({ _id: creating._id }, {
                                $set: {
                                    status: 'failed',
                                    errorMessage: errorMessage,
                                    report: null
                                }
                            })];
                    case 8:
                        _c.sent();
                        throw new common_1.BadRequestException("AI \u62A5\u544A\u751F\u6210\u5931\u8D25\uFF1A" + errorMessage);
                    case 9: return [4 /*yield*/, this.reportModel.findById(creating._id).lean()];
                    case 10:
                        latest = _c.sent();
                        if (!latest) {
                            throw new common_1.BadRequestException('AI 报告生成失败：生成记录不存在');
                        }
                        return [2 /*return*/, this.toReportResponse(latest)];
                }
            });
        });
    };
    StatAIReportService.prototype.buildFilters = function (dto) {
        var _a, _b, _c, _d;
        var defaultMaxByMode = {
            quick: 150,
            standard: 300,
            deep: 500
        };
        var mode = (_a = dto.mode) !== null && _a !== void 0 ? _a : 'standard';
        var timeRange = (_b = dto.timeRange) !== null && _b !== void 0 ? _b : 'all';
        var includeTextAnswers = (_c = dto.includeTextAnswers) !== null && _c !== void 0 ? _c : true;
        var maxAnswers = (_d = dto.maxAnswers) !== null && _d !== void 0 ? _d : defaultMaxByMode[mode];
        return {
            mode: mode,
            timeRange: timeRange,
            includeTextAnswers: includeTextAnswers,
            maxAnswers: maxAnswers
        };
    };
    StatAIReportService.prototype.escapeRegExp = function (input) {
        return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    StatAIReportService.prototype.maskSensitiveText = function (input) {
        var text = input;
        text = text.replace(/1\d{10}/g, '[手机号]');
        text = text.replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[邮箱]');
        text = text.replace(/\b\d{15}(\d{2}[0-9Xx])?\b/g, '[证件号]');
        return text;
    };
    StatAIReportService.prototype.getAnswerValueAsArray = function (value) {
        if (Array.isArray(value)) {
            return value
                .map(function (v) { return (typeof v === 'string' ? v.trim() : String(v !== null && v !== void 0 ? v : '').trim()); })
                .filter(Boolean);
        }
        if (typeof value === 'string') {
            var trimmed = value.trim();
            return trimmed ? [trimmed] : [];
        }
        if (value == null)
            return [];
        var str = String(value).trim();
        return str ? [str] : [];
    };
    StatAIReportService.prototype.getOptionTextFromValue = function (options, value) {
        if (!Array.isArray(options))
            return { value: value, text: value };
        var matched = options.find(function (item) {
            if (!item || typeof item !== 'object')
                return false;
            var val = item.value;
            return String(val !== null && val !== void 0 ? val : '') === value;
        });
        if (!matched)
            return { value: value, text: value };
        var textRaw = matched.text;
        var text = typeof textRaw === 'string' ? textRaw : value;
        return { value: value, text: text };
    };
    StatAIReportService.prototype.buildDataset = function (question, answers, filters) {
        var _this = this;
        var components = Array.isArray(question.componentList)
            ? question.componentList.filter(function (c) { return c && !c.isHidden; })
            : [];
        var componentMap = new Map();
        components.forEach(function (c) {
            var key = typeof c.fe_id === 'string' ? c.fe_id : '';
            if (!key)
                return;
            componentMap.set(key, c);
        });
        var objectiveCounter = new Map();
        var textCollector = new Map();
        var validAnswers = 0;
        answers.forEach(function (answerDoc) {
            var list = Array.isArray(answerDoc.answerList) ? answerDoc.answerList : [];
            if (list.length > 0)
                validAnswers += 1;
            list.forEach(function (item) {
                var _a, _b, _c;
                var feId = typeof item.componentFeId === 'string' ? item.componentFeId : '';
                if (!feId)
                    return;
                var comp = componentMap.get(feId);
                if (!comp)
                    return;
                var type = (_a = comp.type) !== null && _a !== void 0 ? _a : '';
                var values = _this.getAnswerValueAsArray(item.value);
                if (values.length === 0)
                    return;
                if (type === 'questionRadio' || type === 'questionCheckbox') {
                    var perQuestion_1 = (_b = objectiveCounter.get(feId)) !== null && _b !== void 0 ? _b : new Map();
                    values.forEach(function (v) {
                        var _a;
                        perQuestion_1.set(v, ((_a = perQuestion_1.get(v)) !== null && _a !== void 0 ? _a : 0) + 1);
                    });
                    objectiveCounter.set(feId, perQuestion_1);
                    return;
                }
                if (filters.includeTextAnswers && (type === 'questionInput' || type === 'questionTextarea')) {
                    var collected_1 = (_c = textCollector.get(feId)) !== null && _c !== void 0 ? _c : [];
                    values.forEach(function (v) {
                        var masked = _this.maskSensitiveText(v).trim();
                        if (masked)
                            collected_1.push(masked.slice(0, 120));
                    });
                    textCollector.set(feId, collected_1);
                }
            });
        });
        var objectiveQuestions = [];
        components.forEach(function (comp) {
            var _a, _b, _c;
            var feId = (_a = comp.fe_id) !== null && _a !== void 0 ? _a : '';
            if (!feId)
                return;
            if (comp.type !== 'questionRadio' && comp.type !== 'questionCheckbox')
                return;
            var map = (_b = objectiveCounter.get(feId)) !== null && _b !== void 0 ? _b : new Map();
            var options = Array.from(map.entries())
                .sort(function (a, b) { return b[1] - a[1]; })
                .slice(0, 20)
                .map(function (_a) {
                var _b;
                var value = _a[0], count = _a[1];
                var resolved = _this.getOptionTextFromValue((_b = comp.props) === null || _b === void 0 ? void 0 : _b.options, value);
                return {
                    value: resolved.value,
                    text: resolved.text,
                    count: count
                };
            });
            objectiveQuestions.push({
                questionId: feId,
                questionTitle: (_c = comp.title) !== null && _c !== void 0 ? _c : '未命名题目',
                questionType: comp.type,
                options: options
            });
        });
        var textQuestions = [];
        if (filters.includeTextAnswers) {
            components.forEach(function (comp) {
                var _a, _b, _c;
                var feId = (_a = comp.fe_id) !== null && _a !== void 0 ? _a : '';
                if (!feId)
                    return;
                if (comp.type !== 'questionInput' && comp.type !== 'questionTextarea')
                    return;
                var samples = ((_b = textCollector.get(feId)) !== null && _b !== void 0 ? _b : []).slice(0, 30);
                textQuestions.push({
                    questionId: feId,
                    questionTitle: (_c = comp.title) !== null && _c !== void 0 ? _c : '未命名题目',
                    questionType: comp.type,
                    samples: samples
                });
            });
        }
        var questionWithTextCount = textQuestions.filter(function (q) { return q.samples.length > 0; }).length;
        var textCoverage = textQuestions.length
            ? Number((questionWithTextCount / textQuestions.length).toFixed(2))
            : 0;
        return {
            totalAnswers: answers.length,
            validAnswers: validAnswers,
            textCoverage: textCoverage,
            objectiveQuestions: objectiveQuestions,
            textQuestions: textQuestions
        };
    };
    StatAIReportService.prototype.parseAIJsonContent = function (content) {
        var cleaned = content.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        }
        else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        return JSON.parse(cleaned);
    };
    StatAIReportService.prototype.normalizeStringArray = function (value) {
        if (!Array.isArray(value))
            return [];
        return value
            .map(function (item) { return (typeof item === 'string' ? item.trim() : ''); })
            .filter(Boolean);
    };
    StatAIReportService.prototype.normalizeReportResult = function (raw, dataset) {
        var _this = this;
        var obj = typeof raw === 'object' && raw != null ? raw : {};
        var summaryObj = typeof obj.summary === 'object' && obj.summary != null
            ? obj.summary
            : {};
        var highlightsRaw = Array.isArray(obj.highlights) ? obj.highlights : [];
        var questionInsightsRaw = Array.isArray(obj.questionInsights)
            ? obj.questionInsights
            : [];
        return {
            summary: {
                headline: typeof summaryObj.headline === 'string' && summaryObj.headline.trim()
                    ? summaryObj.headline.trim()
                    : '问卷总体分析已完成',
                brief: typeof summaryObj.brief === 'string' && summaryObj.brief.trim()
                    ? summaryObj.brief.trim()
                    : '请结合关键发现与题目洞察制定下一步行动。'
            },
            highlights: highlightsRaw
                .map(function (item) {
                var rec = typeof item === 'object' && item != null ? item : {};
                var title = typeof rec.title === 'string' ? rec.title.trim() : '';
                var detail = typeof rec.detail === 'string' ? rec.detail.trim() : '';
                var evidenceQuestionIds = _this.normalizeStringArray(rec.evidenceQuestionIds);
                if (!title || !detail)
                    return null;
                return { title: title, detail: detail, evidenceQuestionIds: evidenceQuestionIds };
            })
                .filter(function (v) { return Boolean(v); }),
            sampleOverview: {
                totalAnswers: dataset.totalAnswers,
                validAnswers: dataset.validAnswers,
                textCoverage: dataset.textCoverage
            },
            questionInsights: questionInsightsRaw
                .map(function (item) {
                var rec = typeof item === 'object' && item != null ? item : {};
                var questionId = typeof rec.questionId === 'string' ? rec.questionId.trim() : '';
                var questionTitle = typeof rec.questionTitle === 'string' ? rec.questionTitle.trim() : '';
                var questionType = typeof rec.questionType === 'string' ? rec.questionType.trim() : '';
                var finding = typeof rec.finding === 'string' ? rec.finding.trim() : '';
                var evidence = typeof rec.evidence === 'string' ? rec.evidence.trim() : '';
                var chartHint = typeof rec.chartHint === 'string' ? rec.chartHint.trim() : undefined;
                if (!questionId || !finding || !evidence)
                    return null;
                return {
                    questionId: questionId,
                    questionTitle: questionTitle || '未命名题目',
                    questionType: questionType || 'unknown',
                    finding: finding,
                    evidence: evidence,
                    chartHint: chartHint
                };
            })
                .filter(function (v) { return Boolean(v); }),
            risks: this.normalizeStringArray(obj.risks),
            recommendations: this.normalizeStringArray(obj.recommendations),
            confidenceNotes: this.normalizeStringArray(obj.confidenceNotes)
        };
    };
    StatAIReportService.prototype.callAIForReport = function (questionTitle, dataset) {
        var _a, _b, _c;
        return __awaiter(this, void 0, Promise, function () {
            var systemPrompt, userPayload, responseData, content, parsed;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        systemPrompt = '你是一名资深问卷分析师。你必须只基于输入数据分析，不允许臆测。你只输出合法 JSON，不输出 markdown。';
                        userPayload = {
                            questionTitle: questionTitle,
                            sampleOverview: {
                                totalAnswers: dataset.totalAnswers,
                                validAnswers: dataset.validAnswers,
                                textCoverage: dataset.textCoverage
                            },
                            objectiveQuestions: dataset.objectiveQuestions,
                            textQuestions: dataset.textQuestions,
                            outputSchema: {
                                summary: { headline: 'string', brief: 'string' },
                                highlights: [
                                    {
                                        title: 'string',
                                        detail: 'string',
                                        evidenceQuestionIds: ['string']
                                    },
                                ],
                                questionInsights: [
                                    {
                                        questionId: 'string',
                                        questionTitle: 'string',
                                        questionType: 'string',
                                        finding: 'string',
                                        evidence: 'string',
                                        chartHint: 'string(optional)'
                                    },
                                ],
                                risks: ['string'],
                                recommendations: ['string'],
                                confidenceNotes: ['string']
                            },
                            constraints: [
                                '结论必须引用题目 evidence',
                                '如果样本不足，必须在 risks 或 confidenceNotes 中明确提示',
                                '文本题结论必须基于给出的样本，不得虚构原文',
                            ]
                        };
                        return [4 /*yield*/, this.provider.createChatCompletion({
                                model: this.aiConfig.model,
                                messages: [
                                    { role: 'system', content: systemPrompt },
                                    {
                                        role: 'user',
                                        content: "\u8BF7\u6839\u636E\u4EE5\u4E0B\u95EE\u5377\u805A\u5408\u6570\u636E\u751F\u6210\u5206\u6790\u62A5\u544A JSON\uFF1A\n" + JSON.stringify(userPayload)
                                    },
                                ],
                                temperature: this.aiConfig.temperature,
                                maxTokens: Math.min(this.aiConfig.maxTokens, 2600)
                            })];
                    case 1:
                        responseData = _d.sent();
                        content = (_c = (_b = (_a = responseData === null || responseData === void 0 ? void 0 : responseData.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content;
                        if (!content || typeof content !== 'string') {
                            throw new common_1.BadRequestException('AI 返回内容为空');
                        }
                        parsed = this.parseAIJsonContent(content);
                        return [2 /*return*/, this.normalizeReportResult(parsed, dataset)];
                }
            });
        });
    };
    StatAIReportService.prototype.toReportResponse = function (doc) {
        var _a, _b, _c, _d, _e, _f, _g;
        return {
            id: String(doc._id),
            questionId: doc.questionId,
            questionTitle: doc.questionTitle,
            status: doc.status,
            answerCount: (_a = doc.answerCount) !== null && _a !== void 0 ? _a : 0,
            validAnswerCount: (_b = doc.validAnswerCount) !== null && _b !== void 0 ? _b : 0,
            filters: (_c = doc.filters) !== null && _c !== void 0 ? _c : null,
            report: (_d = doc.report) !== null && _d !== void 0 ? _d : null,
            modelInfo: (_e = doc.modelInfo) !== null && _e !== void 0 ? _e : null,
            errorMessage: (_f = doc.errorMessage) !== null && _f !== void 0 ? _f : '',
            createdBy: (_g = doc.createdBy) !== null && _g !== void 0 ? _g : '',
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt
        };
    };
    StatAIReportService = __decorate([
        common_1.Injectable(),
        __param(1, mongoose_1.InjectModel(question_schema_1.Question.name)),
        __param(2, mongoose_1.InjectModel(answer_schema_1.Answer.name)),
        __param(3, mongoose_1.InjectModel(ai_analysis_report_schema_1.AIAnalysisReport.name))
    ], StatAIReportService);
    return StatAIReportService;
}());
exports.StatAIReportService = StatAIReportService;
