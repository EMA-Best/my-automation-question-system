# AI 配置说明

## 通义（阿里云 DashScope，推荐）

本项目后端通过“OpenAI-compatible Chat Completions”协议对接 AI。

通义建议使用兼容模式接口（具体以你的 DashScope 控制台文档为准），常见配置示例如下：

```env
AI_PROVIDER=tongyi
AI_API_KEY=your_dashscope_api_key_here
AI_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
AI_MODEL=qwen-plus
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=2000
AI_TIMEOUT_MS=60000
```

## OpenAI-compatible（通用）

本项目使用 NestJS 的 `ConfigModule` 管理配置，支持通过环境变量进行配置。

### 快速开始

1. 复制环境变量示例文件：

   ```bash
   cp env.example .env
   ```

2. 编辑 `.env` 文件，填写你的 AI API Key（推荐使用通用变量 `AI_*`）：

   ```env
   AI_API_KEY=your_ai_api_key_here
   ```

3. 其他配置项（可选）：

   ```env
   # Provider：tongyi（通义）或 openai-compatible（通用）
   AI_PROVIDER=tongyi

   # API 地址：可填完整地址（包含 /chat/completions）或仅填 baseUrl
   # - 通义兼容模式： https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
   # - DeepSeek：     https://api.deepseek.com/v1/chat/completions
   AI_API_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions

   # 可选：当 AI_API_URL 只提供 baseUrl 时，用该项指定路径；默认 /v1/chat/completions
   # AI_CHAT_COMPLETIONS_PATH=/v1/chat/completions

   # 模型名称（例如 qwen-plus、deepseek-chat、gpt-4o-mini 等，取决于你的服务端）
   AI_MODEL=qwen-plus

   # 温度参数（可选，0-2之间，默认 0.7）
   AI_TEMPERATURE=0.7

   # 最大 token 数（可选，默认 2000）
   AI_MAX_TOKENS=2000

   # 请求超时（毫秒，可选，默认 60000）
   AI_TIMEOUT_MS=60000
   ```

## 清理旧变量（可选）

如果你的 `.env` 里仍残留 `DEEPSEEK_*` 等旧变量，可以直接删除它们（当前代码只读取 `AI_*`）。

### 配置项说明

| 配置项           | 必填 | 默认值                                                               | 说明                       |
| ---------------- | ---- | -------------------------------------------------------------------- | -------------------------- |
| `AI_API_KEY`     | ✅   | -                                                                    | API 密钥（优先）           |
| `AI_API_URL`     | ❌   | `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions` | API 地址（完整或 baseUrl） |
| `AI_MODEL`       | ❌   | `qwen-plus`                                                          | 模型名称                   |
| `AI_TEMPERATURE` | ❌   | `0.7`                                                                | 温度参数（0-2）            |
| `AI_MAX_TOKENS`  | ❌   | `2000`                                                               | 最大 token 数              |
| `AI_TIMEOUT_MS`  | ❌   | `60000`                                                              | 超时（毫秒）               |

### 技术实现

- 使用 `AIConfigService` 类管理配置（基于 `ConfigService`）
- 配置在应用启动时自动加载
- 支持类型安全的配置访问

### 注意事项

- `.env` 文件已添加到 `.gitignore`，不会被提交到版本控制系统
- 请妥善保管你的 API Key，不要泄露给他人
- 如果 API Key 无效，接口会返回 401 错误
- 如果请求频率过高，可能会遇到 429 错误，请稍后重试
- 建议在生产环境中使用环境变量或配置管理服务，而不是直接使用 `.env` 文件
