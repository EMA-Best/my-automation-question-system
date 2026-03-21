"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.UserSchema = exports.User = void 0;
var mongoose_1 = require("@nestjs/mongoose");
var User = /** @class */ (function () {
    function User() {
    }
    __decorate([
        mongoose_1.Prop({
            required: true,
            unique: true
        })
    ], User.prototype, "username");
    __decorate([
        mongoose_1.Prop({
            required: true
        })
    ], User.prototype, "password");
    __decorate([
        mongoose_1.Prop({
            "default": ''
        })
    ], User.prototype, "nickname");
    __decorate([
        mongoose_1.Prop({
            type: String,
            "enum": ['user', 'admin'],
            "default": 'user',
            index: true
        })
    ], User.prototype, "role");
    __decorate([
        mongoose_1.Prop({
            type: String,
            "enum": ['active', 'disabled'],
            "default": 'active',
            index: true
        })
    ], User.prototype, "status");
    __decorate([
        mongoose_1.Prop({
            type: Date,
            "default": null
        })
    ], User.prototype, "lastLoginAt");
    __decorate([
        mongoose_1.Prop({
            type: Boolean,
            "default": false,
            index: true
        })
    ], User.prototype, "mustChangePassword");
    __decorate([
        mongoose_1.Prop({
            type: Date,
            "default": null
        })
    ], User.prototype, "passwordUpdatedAt");
    __decorate([
        mongoose_1.Prop({
            type: String,
            "enum": ['user', 'admin', 'system'],
            "default": null
        })
    ], User.prototype, "passwordUpdatedByRole");
    __decorate([
        mongoose_1.Prop({
            type: String,
            "default": null
        })
    ], User.prototype, "passwordUpdatedBy");
    __decorate([
        mongoose_1.Prop({
            type: String,
            "default": null
        })
    ], User.prototype, "passwordUpdatedIp");
    __decorate([
        mongoose_1.Prop({
            type: String,
            "enum": ['random', 'default', 'manual'],
            "default": null
        })
    ], User.prototype, "passwordResetStrategy");
    User = __decorate([
        mongoose_1.Schema({
            timestamps: true
        })
    ], User);
    return User;
}());
exports.User = User;
exports.UserSchema = mongoose_1.SchemaFactory.createForClass(User);
exports.UserSchema.index({ role: 1, status: 1 });
// 管理端用户列表：role/status 过滤 + createdAt/_id 倒序
exports.UserSchema.index({ role: 1, status: 1, createdAt: -1, _id: -1 });
