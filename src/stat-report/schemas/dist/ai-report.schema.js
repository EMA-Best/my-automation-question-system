"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.AIReportSchema = exports.AIReport = void 0;
var mongoose_1 = require("@nestjs/mongoose");
var AIReport = /** @class */ (function () {
    function AIReport() {
    }
    __decorate([
        mongoose_1.Prop({ required: true, index: true })
    ], AIReport.prototype, "questionId");
    __decorate([
        mongoose_1.Prop({ required: true })
    ], AIReport.prototype, "questionTitle");
    __decorate([
        mongoose_1.Prop({
            type: String,
            "enum": ['processing', 'succeeded', 'failed'],
            "default": 'processing',
            index: true
        })
    ], AIReport.prototype, "status");
    __decorate([
        mongoose_1.Prop({ type: Number, "default": 0 })
    ], AIReport.prototype, "answerCount");
    __decorate([
        mongoose_1.Prop({ type: Number, "default": 0 })
    ], AIReport.prototype, "validAnswerCount");
    __decorate([
        mongoose_1.Prop({
            type: {
                mode: { type: String, "default": 'standard' },
                timeRange: { type: String, "default": 'all' },
                includeTextAnswers: { type: Boolean, "default": true },
                maxAnswers: { type: Number, "default": 300 }
            },
            "default": {
                mode: 'standard',
                timeRange: 'all',
                includeTextAnswers: true,
                maxAnswers: 300
            },
            _id: false
        })
    ], AIReport.prototype, "filters");
    __decorate([
        mongoose_1.Prop({ type: Object, "default": null })
    ], AIReport.prototype, "report");
    __decorate([
        mongoose_1.Prop({
            type: {
                provider: { type: String, "default": '' },
                model: { type: String, "default": '' },
                temperature: { type: Number, "default": 0 },
                generatedAt: { type: Date, "default": null }
            },
            "default": null,
            _id: false
        })
    ], AIReport.prototype, "modelInfo");
    __decorate([
        mongoose_1.Prop({ type: String, "default": '' })
    ], AIReport.prototype, "errorMessage");
    __decorate([
        mongoose_1.Prop({ required: true, index: true })
    ], AIReport.prototype, "createdBy");
    AIReport = __decorate([
        mongoose_1.Schema({
            timestamps: true,
            collection: 'ai_analysis_reports'
        })
    ], AIReport);
    return AIReport;
}());
exports.AIReport = AIReport;
exports.AIReportSchema = mongoose_1.SchemaFactory.createForClass(AIReport);
exports.AIReportSchema.index({ questionId: 1, createdAt: -1 });
exports.AIReportSchema.index({ questionId: 1, status: 1, createdAt: -1 });
