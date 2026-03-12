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
exports.TemplateController = void 0;
var common_1 = require("@nestjs/common");
var public_decorator_1 = require("../auth/decorators/public.decorator"); // 公开路由装饰器，跳过 JWT 校验
/**
 * 模板公开接口 + "使用模板"接口
 *
 * 路由前缀：templates
 * 真实路径：/api/templates/...（main.ts 有全局前缀 api）
 *
 * 全局 TransformInterceptor 会统一包装响应为 { errno: 0, data: ... }
 */
var TemplateController = /** @class */ (function () {
    function TemplateController(templateService) {
        this.templateService = templateService;
    }
    // ================================
    // C 端公开接口（无需登录）
    // ================================
    /**
     * 获取公开模板列表
     *
     * GET /api/templates
     * Query: page, pageSize, keyword
     *
     * @Public() 跳过登录校验
     */
    TemplateController.prototype.list = function (page, // 页码，默认第 1 页
    pageSize, // 每页数量，默认 12 条
    keyword) {
        if (page === void 0) { page = '1'; }
        if (pageSize === void 0) { pageSize = '12'; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.templateService.getPublicTemplateList({
                            page: parseInt(page, 10) || 1,
                            pageSize: parseInt(pageSize, 10) || 12,
                            keyword: keyword
                        })];
                    case 1: 
                    // Query 参数为 string 类型，需转换为 number 并提供默认值
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * 获取公开模板详情（预览）
     *
     * GET /api/templates/:id
     * 只返回已发布（templateStatus='published'）的模板
     *
     * @Public() 跳过登录校验
     */
    TemplateController.prototype.detail = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.templateService.getPublicTemplateDetail(id)];
                    case 1: 
                    // Service 层会校验 templateStatus === 'published'，否则 404
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    // ================================
    // "使用模板"接口（需要登录）
    // ================================
    /**
     * 使用模板创建问卷
     *
     * POST /api/templates/:id/use
     *
     * 行为：
     * 1. 校验模板存在且 templateStatus='published'
     * 2. 克隆模板为新问卷（owner = 当前登录用户）
     * 3. componentList 重新生成 fe_id
     * 4. 返回新问卷 id，前端跳转 B 端编辑页
     *
     * 未加 @Public()，需要有效的 Bearer Token
     */
    TemplateController.prototype.useTemplate = function (id, // 模板 MongoDB _id
    req) {
        return __awaiter(this, void 0, void 0, function () {
            var username;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        username = req.user.username;
                        return [4 /*yield*/, this.templateService.useTemplate(id, username)];
                    case 1: // 获取当前登录用户名，用作新问卷的 owner
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    __decorate([
        public_decorator_1.Public() // 无需登录即可访问
        ,
        common_1.Get(),
        __param(0, common_1.Query('page')),
        __param(1, common_1.Query('pageSize')),
        __param(2, common_1.Query('keyword'))
    ], TemplateController.prototype, "list");
    __decorate([
        public_decorator_1.Public() // 无需登录即可访问
        ,
        common_1.Get(':id'),
        __param(0, common_1.Param('id'))
    ], TemplateController.prototype, "detail");
    __decorate([
        common_1.Post(':id/use') // 未加 @Public()，需要有效的 Bearer Token
        ,
        __param(0, common_1.Param('id')),
        __param(1, common_1.Request())
    ], TemplateController.prototype, "useTemplate");
    TemplateController = __decorate([
        common_1.Controller('templates')
    ], TemplateController);
    return TemplateController;
}());
exports.TemplateController = TemplateController;
