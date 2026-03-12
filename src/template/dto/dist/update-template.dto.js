"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.UpdateTemplateDto = void 0;
var class_validator_1 = require("class-validator");
var class_transformer_1 = require("class-transformer");
/**
 * 组件信息 DTO（用于模板 componentList 验证）
 *
 * 对应前端编辑器中的单个组件配置。
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
 * 更新模板 DTO
 *
 * 管理员编辑模板时使用，所有字段可选（支持部分更新）。
 * 只传需要修改的字段即可，未传的字段不会被覆盖。
 *
 * 对应接口：PATCH /api/admin/templates/:id
 */
var UpdateTemplateDto = /** @class */ (function () {
    function UpdateTemplateDto() {
    }
    __decorate([
        class_validator_1.IsOptional(),
        class_validator_1.IsString()
    ], UpdateTemplateDto.prototype, "title");
    __decorate([
        class_validator_1.IsOptional(),
        class_validator_1.IsString()
    ], UpdateTemplateDto.prototype, "templateDesc");
    __decorate([
        class_validator_1.IsOptional(),
        class_validator_1.IsString()
    ], UpdateTemplateDto.prototype, "js");
    __decorate([
        class_validator_1.IsOptional(),
        class_validator_1.IsString()
    ], UpdateTemplateDto.prototype, "css");
    __decorate([
        class_validator_1.IsOptional(),
        class_validator_1.IsNumber()
    ], UpdateTemplateDto.prototype, "sort");
    __decorate([
        class_validator_1.IsOptional(),
        class_validator_1.IsArray(),
        class_validator_1.ValidateNested({ each: true }),
        class_transformer_1.Type(function () { return ComponentInfoDto; })
    ], UpdateTemplateDto.prototype, "componentList");
    return UpdateTemplateDto;
}());
exports.UpdateTemplateDto = UpdateTemplateDto;
