"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.StatModule = void 0;
var common_1 = require("@nestjs/common");
var stat_service_1 = require("./stat.service");
var stat_controller_1 = require("./stat.controller");
var question_module_1 = require("src/question/question.module");
var answer_module_1 = require("src/answer/answer.module");
var mongoose_1 = require("@nestjs/mongoose");
var question_schema_1 = require("src/question/schemas/question.schema");
var answer_schema_1 = require("src/answer/schemas/answer.schema");
var StatModule = /** @class */ (function () {
    function StatModule() {
    }
    StatModule = __decorate([
        common_1.Module({
            imports: [
                question_module_1.QuestionModule,
                answer_module_1.AnswerModule,
                mongoose_1.MongooseModule.forFeature([
                    { name: question_schema_1.Question.name, schema: question_schema_1.QuestionSchema },
                    { name: answer_schema_1.Answer.name, schema: answer_schema_1.AnswerSchema },
                ]),
            ],
            providers: [stat_service_1.StatService],
            controllers: [stat_controller_1.StatController]
        })
    ], StatModule);
    return StatModule;
}());
exports.StatModule = StatModule;
