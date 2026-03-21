"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.StatReportModule = void 0;
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var mongoose_1 = require("@nestjs/mongoose");
var ai_config_1 = require("../config/ai.config");
var answer_schema_1 = require("../answer/schemas/answer.schema");
var question_schema_1 = require("../question/schemas/question.schema");
var ai_report_schema_1 = require("./schemas/ai-report.schema");
var stat_report_controller_1 = require("./stat-report.controller");
var stat_report_service_1 = require("./stat-report.service");
var StatReportModule = /** @class */ (function () {
    function StatReportModule() {
    }
    StatReportModule = __decorate([
        common_1.Module({
            imports: [
                config_1.ConfigModule,
                mongoose_1.MongooseModule.forFeature([
                    { name: answer_schema_1.Answer.name, schema: answer_schema_1.AnswerSchema },
                    { name: question_schema_1.Question.name, schema: question_schema_1.QuestionSchema },
                    { name: ai_report_schema_1.AIReport.name, schema: ai_report_schema_1.AIReportSchema },
                ]),
            ],
            controllers: [stat_report_controller_1.StatReportController],
            providers: [ai_config_1.AIConfigService, stat_report_service_1.StatReportService]
        })
    ], StatReportModule);
    return StatReportModule;
}());
exports.StatReportModule = StatReportModule;
