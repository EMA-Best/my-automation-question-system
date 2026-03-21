"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.QuestionSchema = exports.Question = void 0;
var mongoose_1 = require("@nestjs/mongoose");
var Question = /** @class */ (function () {
    function Question() {
    }
    __decorate([
        mongoose_1.Prop({ required: true })
    ], Question.prototype, "title");
    __decorate([
        mongoose_1.Prop()
    ], Question.prototype, "desc");
    __decorate([
        mongoose_1.Prop({ required: true })
    ], Question.prototype, "author");
    __decorate([
        mongoose_1.Prop()
    ], Question.prototype, "js");
    __decorate([
        mongoose_1.Prop()
    ], Question.prototype, "css");
    __decorate([
        mongoose_1.Prop({ "default": false })
    ], Question.prototype, "isPublished");
    __decorate([
        mongoose_1.Prop({ "default": false })
    ], Question.prototype, "isStar");
    __decorate([
        mongoose_1.Prop({ "default": false })
    ], Question.prototype, "isDeleted");
    __decorate([
        mongoose_1.Prop({ type: Date, "default": null, index: true })
    ], Question.prototype, "deletedAt");
    __decorate([
        mongoose_1.Prop({ type: String, "default": '', index: true })
    ], Question.prototype, "deletedBy");
    __decorate([
        mongoose_1.Prop({ type: String, "default": '' })
    ], Question.prototype, "deleteReason");
    __decorate([
        mongoose_1.Prop({ type: Date, "default": null })
    ], Question.prototype, "restoredAt");
    __decorate([
        mongoose_1.Prop({ type: String, "default": '' })
    ], Question.prototype, "restoredBy");
    __decorate([
        mongoose_1.Prop({
            type: String,
            "enum": ['Draft', 'PendingReview', 'Approved', 'Rejected'],
            "default": 'Draft',
            index: true
        })
    ], Question.prototype, "auditStatus");
    __decorate([
        mongoose_1.Prop({ "default": '' })
    ], Question.prototype, "auditReason");
    __decorate([
        mongoose_1.Prop({ type: Date, "default": null, index: true })
    ], Question.prototype, "auditUpdatedAt");
    __decorate([
        mongoose_1.Prop({ "default": false })
    ], Question.prototype, "featured");
    __decorate([
        mongoose_1.Prop({ "default": false })
    ], Question.prototype, "pinned");
    __decorate([
        mongoose_1.Prop({ type: Date, "default": null })
    ], Question.prototype, "pinnedAt");
    __decorate([
        mongoose_1.Prop()
    ], Question.prototype, "componentList");
    Question = __decorate([
        mongoose_1.Schema({
            timestamps: true
        })
    ], Question);
    return Question;
}());
exports.Question = Question;
exports.QuestionSchema = mongoose_1.SchemaFactory.createForClass(Question);
// 常用筛选条件的联合索引（列表查询/统计查询）
exports.QuestionSchema.index({ author: 1, isDeleted: 1, isStar: 1, _id: -1 });
// 回收站常用索引
exports.QuestionSchema.index({ isDeleted: 1, deletedAt: -1, _id: -1 });
exports.QuestionSchema.index({ deletedBy: 1, deletedAt: -1 });
// 审核队列索引
exports.QuestionSchema.index({ auditStatus: 1, auditUpdatedAt: -1 });
// 公开列表（热门/推荐）常用：isDeleted + isPublished + pinned/featured 组合排序
exports.QuestionSchema.index({
    isDeleted: 1,
    isPublished: 1,
    pinned: -1,
    pinnedAt: -1,
    updatedAt: -1,
    _id: -1
});
exports.QuestionSchema.index({
    isDeleted: 1,
    isPublished: 1,
    featured: -1,
    updatedAt: -1,
    _id: -1
});
// 管理端问卷列表常用：默认未删除 + 运营排序
exports.QuestionSchema.index({
    isDeleted: 1,
    pinned: -1,
    pinnedAt: -1,
    updatedAt: -1,
    _id: -1
});
