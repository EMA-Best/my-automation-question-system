"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.TemplateSchema = exports.Template = void 0;
var mongoose_1 = require("@nestjs/mongoose");
/**
 * 模板实体（独立集合）
 *
 * 设计目标：
 * - 与 Question 解耦，避免同表承载“问卷实例 + 模板资产”双语义。
 * - 保留与前端模板管理一致的字段，后续可独立扩展模板能力。
 */
var Template = /** @class */ (function () {
    function Template() {
    }
    __decorate([
        mongoose_1.Prop({ required: true })
    ], Template.prototype, "title");
    __decorate([
        mongoose_1.Prop({ "default": '' })
    ], Template.prototype, "templateDesc");
    __decorate([
        mongoose_1.Prop({ "default": '' })
    ], Template.prototype, "js");
    __decorate([
        mongoose_1.Prop({ "default": '' })
    ], Template.prototype, "css");
    __decorate([
        mongoose_1.Prop({ type: Number, "default": 0 })
    ], Template.prototype, "sort");
    __decorate([
        mongoose_1.Prop({
            type: String,
            "enum": ['draft', 'published'],
            "default": 'draft',
            index: true
        })
    ], Template.prototype, "templateStatus");
    __decorate([
        mongoose_1.Prop({ required: true, index: true })
    ], Template.prototype, "author");
    __decorate([
        mongoose_1.Prop({ type: String, "default": '', index: true })
    ], Template.prototype, "sourceQuestionId");
    __decorate([
        mongoose_1.Prop({ type: Number, "default": 0 })
    ], Template.prototype, "useCount");
    __decorate([
        mongoose_1.Prop({
            type: [
                {
                    fe_id: { type: String, required: true },
                    type: { type: String, required: true },
                    title: { type: String, required: true },
                    isHidden: { type: Boolean, "default": false },
                    isLocked: { type: Boolean, "default": false },
                    props: { type: Object, "default": {} }
                },
            ],
            "default": []
        })
    ], Template.prototype, "componentList");
    Template = __decorate([
        mongoose_1.Schema({
            timestamps: true,
            collection: 'templates'
        })
    ], Template);
    return Template;
}());
exports.Template = Template;
exports.TemplateSchema = mongoose_1.SchemaFactory.createForClass(Template);
// 管理端模板列表常用索引
exports.TemplateSchema.index({ templateStatus: 1, sort: -1, _id: -1 });
