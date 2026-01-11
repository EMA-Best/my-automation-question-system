# AI 问卷生成功能 - 后端配置说明

## 概述

后端已实现 AI 问卷生成功能，使用 DeepSeek 模型进行自然语言到问卷结构的转换。

## 已实现的功能

### 1. API 接口
- **路径**: `POST /api/question/ai-generate`
- **请求参数**: 
  ```json
  {
    "prompt": "用户的自然语言描述"
  }
  ```
- **返回数据**: 标准化的问卷结构（对齐导入导出格式）

### 2. 核心模块

#### AI 服务 (`src/ai/ai.service.ts`)
- 调用 DeepSeek API 生成问卷结构
- 数据验证和清洗
- 错误处理

#### 配置服务 (`src/config/ai.config.ts`)
- 使用 NestJS ConfigModule 管理配置
- 类型安全的配置访问
- 支持环境变量配置

#### Question 服务集成
- `QuestionService.aiGenerateQuestion()` 方法
- 与现有导入导出功能对齐

## 配置步骤

### 1. 创建环境变量文件

复制示例文件：
```bash
cp env.example .env
```

### 2. 配置 DeepSeek API Key

编辑 `.env` 文件，填写你的 API Key：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

### 3. 可选配置项

```env
# API 地址（默认：https://api.deepseek.com/v1/chat/completions）
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions

# 模型名称（默认：deepseek-chat）
DEEPSEEK_MODEL=deepseek-chat

# 温度参数（默认：0.7，范围：0-2）
DEEPSEEK_TEMPERATURE=0.7

# 最大 token 数（默认：2000）
DEEPSEEK_MAX_TOKENS=2000
```

### 4. 获取 DeepSeek API Key

1. 访问 [DeepSeek 官网](https://www.deepseek.com/)
2. 注册/登录账号
3. 进入 API 管理页面
4. 创建 API Key
5. 将 API Key 复制到 `.env` 文件

## 文件结构

```
src/
├── ai/
│   ├── ai.module.ts          # AI 模块定义
│   └── ai.service.ts          # AI 服务实现
├── config/
│   ├── ai.config.ts           # AI 配置服务
│   └── README.md              # 配置说明文档
└── question/
    ├── dto/
    │   └── ai-generate.dto.ts # AI 生成请求 DTO
    ├── question.controller.ts # 控制器（包含 ai-generate 接口）
    └── question.service.ts    # 服务（包含 aiGenerateQuestion 方法）
```

## 技术实现

### 配置管理
- 使用 `@nestjs/config` 的 `ConfigModule`
- 通过 `AIConfigService` 提供类型安全的配置访问
- 支持环境变量和 `.env` 文件

### 数据流程
1. 前端发送自然语言描述到 `/api/question/ai-generate`
2. 后端调用 `AIService.generateQuestion()` 方法
3. `AIService` 使用 `AIConfigService` 获取配置
4. 调用 DeepSeek API 生成问卷结构
5. 验证和清洗返回的数据
6. 返回标准化的问卷数据结构

### 错误处理
- API Key 无效：返回 401 错误
- 请求频率过高：返回 429 错误
- 服务不可用：返回 500 错误
- JSON 解析失败：返回格式错误提示
- 数据验证失败：返回验证错误信息

## 注意事项

1. **安全性**
   - `.env` 文件已添加到 `.gitignore`，不会被提交到版本控制
   - 请妥善保管 API Key，不要泄露给他人
   - 生产环境建议使用环境变量或配置管理服务

2. **性能**
   - API 请求超时时间：60秒
   - 建议的 prompt 长度：不超过 2000 字符
   - 默认最大 token 数：2000（可根据需要调整）

3. **数据格式**
   - 返回的数据格式与导入导出功能对齐
   - 自动生成 `fe_id`（如果 AI 返回的无效）
   - 自动验证和清洗组件数据

## 测试

启动服务后，可以使用以下方式测试：

```bash
curl -X POST http://localhost:3005/api/question/ai-generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prompt": "创建一个用户满意度调查问卷，包含姓名输入、满意度单选、建议多行文本"
  }'
```

## 相关文档

- 详细配置说明：`src/config/README.md`
- 环境变量示例：`env.example`
- 设计文档：`ai问卷生成功能_f428fd86.plan.md`

