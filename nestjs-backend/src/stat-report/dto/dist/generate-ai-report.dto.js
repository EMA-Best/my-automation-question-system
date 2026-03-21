"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.GenerateAIReportDto = void 0;
var class_validator_1 = require("class-validator");
var GenerateAIReportDto = /** @class */ (function () {
    function GenerateAIReportDto() {
    }
    __decorate([
        class_validator_1.IsOptional(),
        class_validator_1.IsIn(['quick', 'standard', 'deep'])
    ], GenerateAIReportDto.prototype, "mode");
    __decorate([
        class_validator_1.IsOptional(),
        class_validator_1.IsIn(['all', '7d', '30d'])
    ], GenerateAIReportDto.prototype, "timeRange");
    __decorate([
        class_validator_1.IsOptional(),
        class_validator_1.IsBoolean()
    ], GenerateAIReportDto.prototype, "includeTextAnswers");
    __decorate([
        class_validator_1.IsOptional(),
        class_validator_1.IsNumber(),
        class_validator_1.Min(20),
        class_validator_1.Max(1000)
    ], GenerateAIReportDto.prototype, "maxAnswers");
    return GenerateAIReportDto;
}());
exports.GenerateAIReportDto = GenerateAIReportDto;
