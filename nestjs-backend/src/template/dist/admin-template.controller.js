"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.AdminTemplateController = void 0;
var common_1 = require("@nestjs/common");
var require_permissions_decorator_1 = require("../auth/decorators/require-permissions.decorator"); // 权限校验装饰器
/**
 * 管理员模板管理接口
 *
 * 路由前缀：admin/templates
 * 真实路径：/api/admin/templates/...
 *
 * 所有接口都需要 admin 权限（通过 @RequirePermissions 校验）
 */
var AdminTemplateController = /** @class */ (function () {
    function AdminTemplateController(templateService) {
        this.templateService = templateService;
    }
    /**
     * 管理员模板列表
     *
     * GET /api/admin/templates
     * 返回 draft + published，支持关键词/状态筛选与分页
     */
    AdminTemplateController.prototype.list = function (page, // 页码，默认第 1 页
    pageSize, // 每页数量，默认 10 条
    keyword, // 关键词搜索（匹配标题/描述）
    templateStatus) {
        if (page === void 0) { page = '1'; }
        if (pageSize === void 0) { pageSize = '10'; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.templateService.adminListTemplates({
                            page: parseInt(page, 10) || 1,
                            pageSize: parseInt(pageSize, 10) || 10,
                            keyword: keyword,
                            templateStatus: templateStatus
                        })];
                    case 1: 
                    // 转换 Query 参数类型并传递给 Service
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * 管理员模板详情
     *
     * GET /api/admin/templates/:id
     * 不受 templateStatus 限制，draft 也可查看（用于编辑）
     */
    AdminTemplateController.prototype.detail = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.templateService.adminGetTemplateDetail(id)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * 创建空模板
     *
     * POST /api/admin/templates
     * Body: { title, templateDesc?, js?, css?, sort?, componentList? }
     */
    AdminTemplateController.prototype.create = function (dto, // 经过 class-validator 自动验证
    req) {
        return __awaiter(this, void 0, void 0, function () {
            var author;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        author = req.user.username;
                        return [4 /*yield*/, this.templateService.adminCreateTemplate(dto, author)];
                    case 1: // 当前操作者作为模板 owner
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * 从现有问卷保存为模板
     *
     * POST /api/admin/templates/from-question/:questionId
     * 克隆问卷结构为新的模板（templateStatus='draft'）
     */
    AdminTemplateController.prototype.createFromQuestion = function (questionId, // 源问卷 MongoDB _id
    req) {
        return __awaiter(this, void 0, void 0, function () {
            var author;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        author = req.user.username;
                        return [4 /*yield*/, this.templateService.adminCreateFromQuestion(questionId, author)];
                    case 1: // 当前操作者作为新模板的 owner
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * 更新模板
     *
     * PATCH /api/admin/templates/:id
     * Body: { title?, templateDesc?, js?, css?, sort?, componentList? }
     */
    AdminTemplateController.prototype.update = function (id, // 模板 MongoDB _id
    dto) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.templateService.adminUpdateTemplate(id, dto)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * 发布模板（templateStatus → 'published'）
     *
     * POST /api/admin/templates/:id/publish
     */
    AdminTemplateController.prototype.publish = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.templateService.adminPublishTemplate(id)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * 下线模板（templateStatus → 'draft'）
     *
     * POST /api/admin/templates/:id/unpublish
     */
    AdminTemplateController.prototype.unpublish = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.templateService.adminUnpublishTemplate(id)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * 删除模板（硬删除）
     *
     * DELETE /api/admin/templates/:id
     */
    AdminTemplateController.prototype.remove = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.templateService.adminDeleteTemplate(id)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    __decorate([
        common_1.Get(),
        require_permissions_decorator_1.RequirePermissions('question:read:any') // 需要问卷读取权限
        ,
        __param(0, common_1.Query('page')),
        __param(1, common_1.Query('pageSize')),
        __param(2, common_1.Query('keyword')),
        __param(3, common_1.Query('templateStatus'))
    ], AdminTemplateController.prototype, "list");
    __decorate([
        common_1.Get(':id'),
        require_permissions_decorator_1.RequirePermissions('question:read:any'),
        __param(0, common_1.Param('id'))
    ], AdminTemplateController.prototype, "detail");
    __decorate([
        common_1.Post(),
        require_permissions_decorator_1.RequirePermissions('question:update:any') // 需要问卷编辑权限
        ,
        __param(0, common_1.Body()),
        __param(1, common_1.Request())
    ], AdminTemplateController.prototype, "create");
    __decorate([
        common_1.Post('from-question/:questionId'),
        require_permissions_decorator_1.RequirePermissions('question:update:any'),
        __param(0, common_1.Param('questionId')),
        __param(1, common_1.Request())
    ], AdminTemplateController.prototype, "createFromQuestion");
    __decorate([
        common_1.Patch(':id'),
        require_permissions_decorator_1.RequirePermissions('question:update:any'),
        __param(0, common_1.Param('id')),
        __param(1, common_1.Body())
    ], AdminTemplateController.prototype, "update");
    __decorate([
        common_1.Post(':id/publish'),
        require_permissions_decorator_1.RequirePermissions('question:update:any'),
        __param(0, common_1.Param('id'))
    ], AdminTemplateController.prototype, "publish");
    __decorate([
        common_1.Post(':id/unpublish'),
        require_permissions_decorator_1.RequirePermissions('question:update:any'),
        __param(0, common_1.Param('id'))
    ], AdminTemplateController.prototype, "unpublish");
    __decorate([
        common_1.Delete(':id'),
        require_permissions_decorator_1.RequirePermissions('question:update:any'),
        __param(0, common_1.Param('id'))
    ], AdminTemplateController.prototype, "remove");
    AdminTemplateController = __decorate([
        common_1.Controller('admin/templates')
    ], AdminTemplateController);
    return AdminTemplateController;
}());
exports.AdminTemplateController = AdminTemplateController;
