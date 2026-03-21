"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.AppModule = void 0;
var common_1 = require("@nestjs/common");
var app_controller_1 = require("./app.controller");
var app_service_1 = require("./app.service");
var question_module_1 = require("./question/question.module");
var mongoose_1 = require("@nestjs/mongoose");
var config_1 = require("@nestjs/config");
var user_module_1 = require("./user/user.module");
var auth_module_1 = require("./auth/auth.module");
var answer_module_1 = require("./answer/answer.module");
var stat_module_1 = require("./stat/stat.module");
var admin_module_1 = require("./admin/admin.module");
var template_module_1 = require("./template/template.module");
var AppModule = /** @class */ (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        common_1.Module({
            imports: [
                config_1.ConfigModule.forRoot(),
                mongoose_1.MongooseModule.forRoot("mongodb://" + process.env.MONGO_HOST + ":" + process.env.MONGO_PORT + "/" + process.env.MONGO_DATABASE),
                question_module_1.QuestionModule,
                user_module_1.UserModule,
                auth_module_1.AuthModule,
                answer_module_1.AnswerModule,
                stat_module_1.StatModule,
                admin_module_1.AdminModule,
                template_module_1.TemplateModule,
            ],
            controllers: [app_controller_1.AppController],
            providers: [app_service_1.AppService]
        })
    ], AppModule);
    return AppModule;
}());
exports.AppModule = AppModule;
