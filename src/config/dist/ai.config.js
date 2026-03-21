"use strict";
/**
 * AI 配置文件
 * 用于管理 AI 服务（OpenAI-compatible：OpenAI/DeepSeek/其他兼容接口）的配置信息
 *
 * 使用 NestJS ConfigModule 进行配置管理
 *
 * 使用方式：
 * 1. 在项目根目录创建 .env 文件
 * 2. 参考 .env.example 文件添加配置
 * 3. 配置会自动通过 ConfigModule 加载
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.AIConfigService = void 0;
var common_1 = require("@nestjs/common");
function getDefaultApiUrl(provider) {
    // 注意：这里给出“默认值”，不代表唯一正确配置；用户可通过 AI_API_URL 覆盖。
    if (provider === 'tongyi') {
        // DashScope 的 OpenAI-compatible 通常是带前缀的 v1：/compatible-mode/v1/chat/completions
        return 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
    }
    // openai-compatible：不同厂商 URL / 路径差异较大，建议显式配置 AI_API_URL。
    return '';
}
function getDefaultModel(provider) {
    // 说明：默认模型只是“开箱可用”的兜底值，建议在 .env 显式配置 AI_MODEL。
    if (provider === 'tongyi')
        return 'qwen-plus';
    return '';
}
function parseApiUrl(input) {
    var trimmed = input.trim();
    if (!trimmed) {
        throw new Error('AI_API_URL 不能为空');
    }
    // 允许两种写法：
    // 1) 完整地址：https://host/prefix/v1/chat/completions
    // 2) baseURL：https://host 或 https://host/prefix/v1
    //
    // 说明：为了支持“baseURL 本身带路径前缀”（如通义兼容模式 /compatible-mode/v1），
    // 这里会尽量保留 pathname 在 baseUrl 中。
    try {
        var url = new URL(trimmed);
        // full endpoint：包含 /chat/completions
        var completionsIndex = url.pathname.indexOf('/chat/completions');
        if (completionsIndex >= 0) {
            var prefix = url.pathname.slice(0, completionsIndex);
            var baseUrl_1 = "" + url.origin + prefix;
            var path_1 = url.pathname.slice(completionsIndex);
            return { baseUrl: baseUrl_1, path: path_1 };
        }
        // baseURL：可能是 https://host 或 https://host/prefix/v1
        var baseUrl = "" + url.origin + url.pathname.replace(/\/+$/, '');
        var endsWithV1 = url.pathname.replace(/\/+$/, '').endsWith('/v1');
        var path = endsWithV1 ? '/chat/completions' : '/v1/chat/completions';
        return {
            baseUrl: baseUrl === url.origin ? url.origin : baseUrl,
            path: path
        };
    }
    catch (_a) {
        throw new Error("AI_API_URL \u4E0D\u662F\u5408\u6CD5 URL\uFF1A" + input);
    }
}
var AIConfigService = /** @class */ (function () {
    function AIConfigService(configService) {
        this.configService = configService;
    }
    AIConfigService.prototype.getConfig = function () {
        var _a, _b, _c;
        // provider：当前后端实现基于 OpenAI-compatible Chat Completions。
        // 为了“通义优先”，这里默认 provider 取 tongyi（如需其他供应商请在 .env 指定 AI_PROVIDER）。
        var providerRaw = (_a = this.configService.get('AI_PROVIDER')) === null || _a === void 0 ? void 0 : _a.trim();
        var provider = providerRaw === 'openai-compatible' ? 'openai-compatible' : 'tongyi';
        var apiKey = this.configService.get('AI_API_KEY');
        var apiUrlRaw = (_b = this.configService.get('AI_API_URL')) === null || _b === void 0 ? void 0 : _b.trim();
        var apiUrl = apiUrlRaw || getDefaultApiUrl(provider);
        if (!apiUrl) {
            throw new Error('当 AI_PROVIDER=openai-compatible 时，必须显式配置 AI_API_URL（例如 https://api.openai.com/v1/chat/completions）');
        }
        var _d = parseApiUrl(apiUrl), baseUrl = _d.baseUrl, path = _d.path;
        var chatCompletionsPath = this.configService.get('AI_CHAT_COMPLETIONS_PATH') || path;
        var modelRaw = (_c = this.configService.get('AI_MODEL')) === null || _c === void 0 ? void 0 : _c.trim();
        var model = modelRaw || getDefaultModel(provider);
        if (!model) {
            throw new Error('当 AI_PROVIDER=openai-compatible 时，必须显式配置 AI_MODEL（例如 gpt-4o-mini / deepseek-chat 等）');
        }
        // 当前获取的temperature是字符串，需转换为数字
        var temperatureStr = this.configService.get('AI_TEMPERATURE');
        var temperature = temperatureStr ? parseFloat(temperatureStr) : 0.7;
        // token同理，需要转换为数字
        var maxTokensStr = this.configService.get('AI_MAX_TOKENS');
        var maxTokens = maxTokensStr ? parseInt(maxTokensStr, 10) : 2000;
        var timeoutStr = this.configService.get('AI_TIMEOUT_MS');
        var timeoutMs = timeoutStr ? parseInt(timeoutStr, 10) : 120000;
        if (!apiKey) {
            throw new Error('AI_API_KEY 环境变量未设置，请在 .env 文件中配置');
        }
        return {
            provider: provider,
            apiKey: apiKey,
            baseUrl: baseUrl,
            chatCompletionsPath: chatCompletionsPath,
            model: model,
            temperature: temperature,
            maxTokens: maxTokens,
            timeoutMs: timeoutMs
        };
    };
    AIConfigService = __decorate([
        common_1.Injectable()
    ], AIConfigService);
    return AIConfigService;
}());
exports.AIConfigService = AIConfigService;
