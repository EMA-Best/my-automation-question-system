"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.QuestionReviewSchema = exports.QuestionReview = void 0;
var mongoose_1 = require("@nestjs/mongoose");
var mongoose_2 = require("mongoose");
var QuestionReview = /** @class */ (function () {
    function QuestionReview() {
    }
    __decorate([
        mongoose_1.Prop({
            type: mongoose_2["default"].Schema.Types.ObjectId,
            required: true,
            ref: 'Question',
            index: true
        })
    ], QuestionReview.prototype, "questionId");
    __decorate([
        mongoose_1.Prop({ required: true, index: true })
    ], QuestionReview.prototype, "author");
    __decorate([
        mongoose_1.Prop({ required: true, index: true })
    ], QuestionReview.prototype, "submitter");
    __decorate([
        mongoose_1.Prop({ "default": '' })
    ], QuestionReview.prototype, "reviewer");
    __decorate([
        mongoose_1.Prop({
            type: String,
            "enum": ['PendingReview', 'Approved', 'Rejected'],
            required: true,
            index: true
        })
    ], QuestionReview.prototype, "status");
    __decorate([
        mongoose_1.Prop({ "default": '' })
    ], QuestionReview.prototype, "reason");
    __decorate([
        mongoose_1.Prop({ type: Date, required: true, index: true })
    ], QuestionReview.prototype, "submittedAt");
    __decorate([
        mongoose_1.Prop({ type: Date, "default": null })
    ], QuestionReview.prototype, "reviewedAt");
    __decorate([
        mongoose_1.Prop({ type: Object, "default": null })
    ], QuestionReview.prototype, "snapshot");
    QuestionReview = __decorate([
        mongoose_1.Schema({
            collection: 'question_reviews'
        })
    ], QuestionReview);
    return QuestionReview;
}());
exports.QuestionReview = QuestionReview;
exports.QuestionReviewSchema = mongoose_1.SchemaFactory.createForClass(QuestionReview);
exports.QuestionReviewSchema.index({ status: 1, submittedAt: -1 });
exports.QuestionReviewSchema.index({ questionId: 1, submittedAt: -1 });
// 审核通过/驳回时按 questionId + status 查询并取最新提交记录
exports.QuestionReviewSchema.index({
    questionId: 1,
    status: 1,
    submittedAt: -1,
    _id: -1
});
