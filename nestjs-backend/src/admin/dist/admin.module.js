"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.AdminModule = void 0;
var common_1 = require("@nestjs/common");
var admin_controller_1 = require("./admin.controller");
var admin_review_controller_1 = require("./admin-review.controller");
var admin_review_service_1 = require("./admin-review.service");
var admin_question_controller_1 = require("./admin-question.controller");
var admin_question_service_1 = require("./admin-question.service");
var admin_user_controller_1 = require("./admin-user.controller");
var admin_user_service_1 = require("./admin-user.service");
var mongoose_1 = require("@nestjs/mongoose");
var question_schema_1 = require("../question/schemas/question.schema");
var review_module_1 = require("../review/review.module");
var user_schema_1 = require("../user/schemas/user.schema");
var answer_schema_1 = require("../answer/schemas/answer.schema");
var template_schema_1 = require("../template/schemas/template.schema");
var AdminModule = /** @class */ (function () {
    function AdminModule() {
    }
    AdminModule = __decorate([
        common_1.Module({
            imports: [
                mongoose_1.MongooseModule.forFeature([
                    { name: question_schema_1.Question.name, schema: question_schema_1.QuestionSchema },
                    { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
                    { name: answer_schema_1.Answer.name, schema: answer_schema_1.AnswerSchema },
                    { name: template_schema_1.Template.name, schema: template_schema_1.TemplateSchema },
                ]),
                review_module_1.ReviewModule,
            ],
            controllers: [
                admin_controller_1.AdminController,
                admin_review_controller_1.AdminReviewController,
                admin_question_controller_1.AdminQuestionController,
                admin_user_controller_1.AdminUserController,
            ],
            providers: [admin_review_service_1.AdminReviewService, admin_question_service_1.AdminQuestionService, admin_user_service_1.AdminUserService]
        })
    ], AdminModule);
    return AdminModule;
}());
exports.AdminModule = AdminModule;
