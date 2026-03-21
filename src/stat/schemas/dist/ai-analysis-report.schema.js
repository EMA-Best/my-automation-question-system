"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.AIAnalysisReportSchema = exports.AIAnalysisReport = void 0;
var mongoose_1 = require("@nestjs/mongoose");
var AIAnalysisReport = /** @class */ (function () {
    function AIAnalysisReport() {
    }
    __decorate([
        mongoose_1.Prop({ required: true, index: true })
    ], AIAnalysisReport.prototype, "questionId");
    __decorate([
        mongoose_1.Prop({ "default": '' })
    ], AIAnalysisReport.prototype, "questionTitle");
    __decorate([
        mongoose_1.Prop({
            type: String,
            "enum": ['pending', 'processing', 'succeeded', 'failed'],
            "default": 'pending',
            index: true
        })
    ], AIAnalysisReport.prototype, "status");
    __decorate([
        mongoose_1.Prop({ type: Number, "default": 0 })
    ], AIAnalysisReport.prototype, "answerCount");
    __decorate([
        mongoose_1.Prop({ type: Number, "default": 0 })
    ], AIAnalysisReport.prototype, "validAnswerCount");
    __decorate([
        mongoose_1.Prop({ type: Object, "default": {} })
    ], AIAnalysisReport.prototype, "filters");
    __decorate([
        mongoose_1.Prop({ type: Object, "default": null })
    ], AIAnalysisReport.prototype, "report");
    __decorate([
        mongoose_1.Prop({ type: Object, "default": {} })
    ], AIAnalysisReport.prototype, "modelInfo");
    __decorate([
        mongoose_1.Prop({ "default": '' })
    ], AIAnalysisReport.prototype, "errorMessage");
    __decorate([
        mongoose_1.Prop({ "default": 'system' })
    ], AIAnalysisReport.prototype, "createdBy");
    AIAnalysisReport = __decorate([
        mongoose_1.Schema({
            timestamps: true,
            collection: 'ai_analysis_reports'
        })
    ], AIAnalysisReport);
    return AIAnalysisReport;
}());
exports.AIAnalysisReport = AIAnalysisReport;
exports.AIAnalysisReportSchema = mongoose_1.SchemaFactory.createForClass(AIAnalysisReport);
exports.AIAnalysisReportSchema.index({ questionId: 1, createdAt: -1 });
exports.AIAnalysisReportSchema.index({ questionId: 1, status: 1, createdAt: -1 });
