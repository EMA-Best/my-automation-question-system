"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.CreateTemplateDto = void 0;
var class_validator_1 = require("class-validator");
var class_transformer_1 = require("class-transformer");
/**
 * 组件信息 DTO（用于模板 componentList 验证）
 *
 * 对应前端编辑器中的单个组件配置，
 * 包含组件类型、标题、属性、显示/锁定状态等。
 */
var ComponentInfoDto = /** @class */ (function () {
    function ComponentInfoDto() {
    }
    __decorate([
        class_validator_1.IsString()
    ], ComponentInfoDto.prototype, "fe_id");
    __decorate([
        class_validator_1.IsString()
    ], ComponentInfoDto.prototype, "type");
    __decorate([
        class_validator_1.IsString()
    ], ComponentInfoDto.prototype, "title");
    __decorate([
        class_validator_1.IsOptional()
    ], ComponentInfoDto.prototype, "isHidden");
    __decorate([
        class_validator_1.IsOptional()
    ], ComponentInfoDto.prototype, "isLocked");
    __decorate([
        class_validator_1.IsOptional()
    ], ComponentInfoDto.prototype, "props");
    return ComponentInfoDto;
}());
/**
 * 创建模板 DTO
 *
 * 管理员创建空模板时使用，title 必填，其余字段均可选。
 * 如果不传 componentList，后端会自动创建一个 questionInfo 组件作为初始内容。
 *
 * 对应接口：POST /api/admin/templates
 */
var CreateTemplateDto = /** @class */ (function () {
    function CreateTemplateDto() {
    }
    __decorate([
        class_validator_1.IsString()
    ], CreateTemplateDto.prototype, "title");
    __decorate([
        class_validator_1.IsOptional(),
        class_validator_1.IsString()
    ], CreateTemplateDto.prototype, "templateDesc");
    __decorate([
        class_validator_1.IsOptional(),
        class_validator_1.IsString()
    ], CreateTemplateDto.prototype, "js");
    __decorate([
        class_validator_1.IsOptional(),
        class_validator_1.IsString()
    ], CreateTemplateDto.prototype, "css");
    __decorate([
        class_validator_1.IsOptional(),
        class_validator_1.IsNumber()
    ], CreateTemplateDto.prototype, "sort");
    __decorate([
        class_validator_1.IsOptional(),
        class_validator_1.IsArray(),
        class_validator_1.ValidateNested({ each: true }),
        class_transformer_1.Type(function () { return ComponentInfoDto; })
    ], CreateTemplateDto.prototype, "componentList");
    return CreateTemplateDto;
}());
exports.CreateTemplateDto = CreateTemplateDto;
