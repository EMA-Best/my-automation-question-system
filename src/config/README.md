# AI 配置说明

## DeepSeek API 配置

本项目使用 NestJS 的 `ConfigModule` 管理配置，支持通过环境变量进行配置。

### 快速开始

1. 复制环境变量示例文件：
   ```bash
   cp env.example .env
   ```

2. 编辑 `.env` 文件，填写你的 DeepSeek API Key：
   ```env
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   ```

3. 其他配置项（可选）：
   ```env
   # DeepSeek API 地址（可选，默认值如下）
   DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions

   # DeepSeek 模型名称（可选，默认值如下）
   DEEPSEEK_MODEL=deepseek-chat

   # 温度参数（可选，0-2之间，默认 0.7）
   DEEPSEEK_TEMPERATURE=0.7

   # 最大 token 数（可选，默认 2000）
   DEEPSEEK_MAX_TOKENS=2000
   ```

### 配置项说明

| 配置项 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `DEEPSEEK_API_KEY` | ✅ | - | DeepSeek API 密钥 |
| `DEEPSEEK_API_URL` | ❌ | `https://api.deepseek.com/v1/chat/completions` | API 地址 |
| `DEEPSEEK_MODEL` | ❌ | `deepseek-chat` | 模型名称 |
| `DEEPSEEK_TEMPERATURE` | ❌ | `0.7` | 温度参数（0-2） |
| `DEEPSEEK_MAX_TOKENS` | ❌ | `2000` | 最大 token 数 |

### 获取 DeepSeek API Key

1. 访问 [DeepSeek 官网](https://www.deepseek.com/)
2. 注册/登录账号
3. 进入 API 管理页面
4. 创建 API Key
5. 将 API Key 复制到 `.env` 文件的 `DEEPSEEK_API_KEY` 字段

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

