# 热门问卷展示功能 - 完整实现方案总结

> 基于真实数据驱动，支持置顶/推荐、题目统计、答卷统计的完整前后端实现

---

## 📋 功能概览

| 功能           | 说明                     | 状态 |
| -------------- | ------------------------ | ---- |
| 真实数据驱动   | 替换硬编码问卷列表       | ✅   |
| 置顶(pinned)   | 问卷置顶标签和优先展示   | ✅   |
| 推荐(featured) | 问卷推荐标签和优先展示   | ✅   |
| 优先级管理     | 置顶>推荐>普通的智能排序 | ✅   |
| 题目统计       | 精确计算非填写类题目数   | ✅   |
| 答卷统计       | 统计总填写人数           | ✅   |
| 问卷预览       | 可看不可编辑的预览页面   | ✅   |
| 管理员接口     | 后台设置推荐/置顶        | ✅   |

---

## 🏗️ 系统架构

### 前端架构

```
首页 (page.tsx)
    ↓ 调用 getFeaturedQuestions()
    ↓
Services Layer (question.ts)
    ↓ HTTP GET /api/questions/featured
    ↓
渲染列表 + 置顶/推荐徽章
    ↓ 用户点击
    ↓
预览页 ([id]/preview.tsx)
    ↓ 调用 getQuestionPreview()
    ↓
显示详细内容 + 统计数据 + 填写入口
```

### 后端架构

```
Controller (API路由)
    ↓
Service (业务逻辑)
    ├─ getFeaturedQuestions() - 查询+统计+排序
    ├─ getQuestionPreview() - 单个问卷预览
    ├─ countQuestions() - 题目计数
    └─ countAnswers() - 答卷计数
    ↓
Data Layer
    ├─ Questions Collection
    └─ Answers Collection
```

---

## 🎯 优先级排序规则

### 权重计算

```
优先级权重 = pinned权重(1000) + featured权重(100) + 时间因子

组合结果：
┌─────────────────────────────────────┐
│ 优先级最高  置顶 + 推荐 (1100分)    │
├─────────────────────────────────────┤
│ 优先级高    仅置顶 (1000分)         │
├─────────────────────────────────────┤
│ 优先级中    仅推荐 (100分)          │
├─────────────────────────────────────┤
│ 优先级低    普通 (0分，不展示)      │
└─────────────────────────────────────┘

同优先级下：按发布时间降序 (新→旧)
```

### 排序示例

```
[1] 2024-01-20 置顶+推荐 "年轻人动漫调查" ← 权重1100，时间最新
[2] 2024-01-15 仅置顶    "产品满意度调查" ← 权重1000
[3] 2024-01-18 仅推荐    "员工满意度调查" ← 权重100，时间更新
[4] 2024-01-10 仅推荐    "用户体验调查"   ← 权重100，时间较旧
```

---

## 📦 前端实现详情

### 1. 服务层 (`src/services/question.ts`)

```typescript
✅ getQuestionById(id)          - 获取完整问卷（编辑/填写）
✅ getFeaturedQuestions()        - 获取热门问卷列表（新增）
✅ getQuestionPreview(id)        - 获取问卷预览（新增）
```

### 2. 首页 (`src/app/page.tsx`)

```typescript
变更内容：
✅ 导入 getFeaturedQuestions 服务
✅ 添加 QuestionList 异步组件
✅ 动态渲染问卷列表
✅ 添加 pinned/featured 徽章标签
✅ 显示题目数和答卷数统计
✅ 链接到预览页面 /question/[id]/preview
```

### 3. 预览页面 (`src/app/question/[id]/preview.tsx`)（新增）

```typescript
功能：
✅ 获取问卷完整信息
✅ 展示问卷标题、描述、统计数据
✅ 列出所有题目（不同样式区分题型）
✅ 禁用交互操作（只读模式）
✅ 提供"立即填写"按钮链接到编辑页
✅ 支持打印功能
```

### 4. UI/UX 改进

```
徽章标签：
  🔝 置顶  (红色背景)
  ⭐ 推荐  (黄色背景)

统计卡片：
  📋 共10个问题
  👥 已有523人填写
  📅 发布日期

预览提示：
  💡 此为预览模式，无法编辑
  [开始填写] [打印预览]

错误处理：
  ✅ 网络错误友好提示
  ✅ 问卷不存在 404提示
```

---

## 🛠️ 后端实现详情

### 1. 数据库 Schema

```typescript
Question文档：
{
  _id: ObjectId,
  title: String,              // 问卷标题
  description: String,        // 描述
  components: Array,          // 题目列表
  featured: Boolean,          // ✅ 推荐标志
  pinned: Boolean,           // ✅ 置顶标志
  publishedAt: Date,         // 发布时间
  status: String,            // draft/published
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId,
}

Answer文档：
{
  _id: ObjectId,
  questionId: ObjectId,       // 关联问卷
  answers: Array,             // 答案数据
  submittedAt: Date,
}
```

### 2. Service 层核心方法

```typescript
✅ getFeaturedQuestions()
   - 查询 featured=true 或 pinned=true 的问卷
   - 计算每个问卷的题目数
   - 统计每个问卷的答卷数
   - 按优先级权重排序
   - 返回统计数据

✅ getQuestionPreview(id)
   - 获取单个问卷完整信息
   - 包含components和统计数据
   - 用于预览页面

✅ countQuestions(components)
   - 过滤排除 input/textarea/number等填写类
   - 只计算实际的问卷题目
   - 例如：radio/checkbox/select等选择题

✅ countAnswers(questionId)
   - 查询Answer集合
   - 统计该问卷的答卷总数
```

### 3. Controller 层 API

```typescript
GET  /api/questions/featured
     → getFeaturedQuestions()
     → 返回热门问卷列表

GET  /api/questions/:id/preview
     → getQuestionPreview(:id)
     → 返回问卷预览信息

GET  /api/questions/:id
     → getQuestion(:id)
     → 返回完整问卷（编辑用）

PATCH /api/questions/:id/admin/featured
     → setFeatured(:id, featured)
     → 管理员设置推荐 [需要权限验证]

PATCH /api/questions/:id/admin/pinned
     → setPinned(:id, pinned)
     → 管理员设置置顶 [需要权限验证]

PATCH /api/questions/:id/admin/publish
     → publishQuestion(:id)
     → 管理员发布问卷 [需要权限验证]
```

### 4. 响应格式

```json
// 获取热门问卷列表响应
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "title": "年轻人动漫偏好调查",
      "description": "了解年轻人对不同类型动漫的偏好和观看习惯",
      "featured": true,
      "pinned": false,
      "questionCount": 10,
      "answerCount": 523,
      "publishedAt": "2024-01-15T10:00:00Z"
    }
  ]
}

// 获取问卷预览响应
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "title": "年轻人动漫偏好调查",
    "description": "...",
    "components": [
      {
        "id": "comp_1",
        "type": "radio",
        "label": "您最喜欢的动漫类型？",
        "options": [...]
      }
    ],
    "featured": true,
    "pinned": false,
    "questionCount": 10,
    "answerCount": 523,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

## 🗄️ 数据库迁移步骤

### Step 1: 添加字段到现有数据

```javascript
db.questions.updateMany({}, { $set: { featured: false, pinned: false } });
```

### Step 2: 创建性能索引

```javascript
db.questions.createIndex({
  featured: 1,
  pinned: 1,
  publishedAt: -1,
});
```

### Step 3: 手动设置热门问卷

```javascript
// 设置为推荐
db.questions.updateOne({ _id: ObjectId("...") }, { $set: { featured: true } });

// 设置为置顶
db.questions.updateOne({ _id: ObjectId("...") }, { $set: { pinned: true } });
```

---

## 📝 题目数量统计规则

### 排除的题型（填写类）

```
❌ input      - 短文本输入
❌ textarea   - 长文本输入
❌ number     - 数字输入
❌ email      - 邮箱输入
❌ url        - 链接输入
❌ date       - 日期选择
```

### 计入的题型（选择类）

```
✅ radio      - 单选题
✅ checkbox   - 多选题
✅ select     - 下拉选择
✅ paragraph  - 段落说明
✅ description - 描述文字
```

### 统计示例

```
问卷包含10个组件：
  - 单选题 × 3  ✅
  - 多选题 × 2  ✅
  - 短文本 × 2  ❌
  - 长文本 × 2  ❌
  - 说明文字 × 1  ✅

题目数 = 3 + 2 + 1 = 6
```

---

## 🔄 前后端交互流程

### 用户流程 1: 浏览热门问卷

```
用户访问首页
    ↓
前端: 调用 getFeaturedQuestions()
    ↓
后端:
  1. 查询featured=true或pinned=true的问卷
  2. 遍历每个问卷计算题目数
  3. 查询Answer集合统计答卷数
  4. 按优先级排序
  5. 返回统计数据
    ↓
前端: 渲染问卷列表
  - 标题和描述
  - 置顶/推荐徽章
  - 题目数和答卷数
    ↓
用户点击问卷
    ↓
跳转到 /question/[id]/preview
```

### 用户流程 2: 预览问卷内容

```
用户进入预览页
    ↓
前端: 调用 getQuestionPreview(id)
    ↓
后端:
  1. 根据ID查询问卷完整信息
  2. 返回components（所有题目）
  3. 返回统计数据
    ↓
前端: 渲染问卷详情
  - 问卷标题、描述
  - 置顶/推荐标签
  - 题目数、答卷数、发布日期统计
  - 逐个展示所有题目
    - 题号和题目名称
    - 题型标签
    - 选项（如果是选择题）
    - "预览模式"只读提示
    ↓
用户选择操作：
  - [立即填写] → 跳转到编辑页 /question/[id]
  - [打印预览] → 调用浏览器打印
  - [返回首页] → 回到首页
```

### 管理员流程 3: 设置推荐/置顶

```
管理员访问后台
    ↓
选择问卷，点击"设为推荐"或"设为置顶"
    ↓
前端: 调用 setFeatured() 或 setPinned()
    ↓
后端:
  1. 验证管理员权限（JWT + AdminGuard）
  2. 更新问卷的featured或pinned字段
  3. 返回更新结果
    ↓
前端: 显示成功提示
    ↓
首页热门问卷列表自动更新（下次访问）
```

---

## 🚀 性能优化建议

### 1. 数据库索引

```javascript
// 必需的复合索引
db.questions.createIndex({ featured: 1, pinned: 1, publishedAt: -1 });

// 可选的额外索引
db.questions.createIndex({ status: 1, publishedAt: -1 });
db.questions.createIndex({ createdBy: 1, status: 1 });
```

### 2. 缓存策略

```typescript
// 使用Redis缓存热门问卷列表
// 有效期：5分钟 (300秒)
// 当管理员修改featured/pinned时，清除缓存

const FEATURED_CACHE_KEY = 'featured:questions:list';
const FEATURED_CACHE_TTL = 300; // 秒

async getFeaturedQuestions() {
  // 先查缓存
  const cached = await this.redisClient.get(FEATURED_CACHE_KEY);
  if (cached) return JSON.parse(cached);

  // 缓存未命中，查询数据库
  const data = await this.queryFeaturedQuestions();

  // 写入缓存
  await this.redisClient.setex(
    FEATURED_CACHE_KEY,
    FEATURED_CACHE_TTL,
    JSON.stringify(data)
  );

  return data;
}
```

### 3. 查询优化

```typescript
// 使用投影减少返回的字段
this.questionModel
  .find({ $or: [{ featured: true }, { pinned: true }] })
  .select("title description featured pinned publishedAt")
  .lean() // 返回普通对象而不是Mongoose文档
  .exec();
```

### 4. 异步加载

```typescript
// 分离统计查询，避免阻塞主线程
async getFeaturedQuestions() {
  const questions = await this.questionModel.find({...}).exec();

  // 并行加载统计数据
  return Promise.all(
    questions.map(q => ({
      ...q.toObject(),
      answerCount: this.countAnswers(q._id) // 并行查询
    }))
  );
}
```

---

## 🔐 安全考虑

### 1. 权限验证

```typescript
// 管理员接口需要两层验证
@UseGuards(JwtAuthGuard, AdminGuard)
@Patch(':id/admin/featured')
async setFeatured(...)
```

### 2. 数据验证

```typescript
@Patch(':id/admin/featured')
@UsePipes(new ValidationPipe())
async setFeatured(
  @Param('id', new ParseObjectIdPipe()) id: ObjectId,
  @Body() dto: SetFeaturedDto,
)
```

### 3. 预览接口安全

```typescript
// 预览接口不返回敏感字段
async getQuestionPreview(id) {
  // ✅ 可以返回
  return { title, description, components, featured, pinned }

  // ❌ 不应返回
  // return { ...answer data, creator contact info }
}
```

---

## 📚 文件列表

### 前端代码已实现

- [x] `src/services/question.ts` - 服务层更新
- [x] `src/app/page.tsx` - 首页改造
- [x] `src/app/question/[id]/preview.tsx` - 预览页面（新增）

### 后端代码需实现

- [ ] `src/schemas/question.schema.ts` - Schema更新
- [ ] `src/modules/question/question.service.ts` - Service实现
- [ ] `src/modules/question/question.controller.ts` - Controller实现
- [ ] `src/modules/question/question.module.ts` - 模块配置
- [ ] 数据库迁移脚本

### 文档

- [x] `IMPLEMENTATION_PLAN.md` - 详细实现方案
- [x] `BACKEND_IMPLEMENTATION.md` - 后端实现指南
- [x] 本文档 - 总体总结

---

## ✅ 实现检查清单

### 前端部分

- [x] 服务层：getFeaturedQuestions()
- [x] 服务层：getQuestionPreview()
- [x] 首页：动态加载问卷列表
- [x] 首页：显示推荐/置顶徽章
- [x] 首页：显示题目数和答卷数
- [x] 首页：错误处理
- [x] 预览页：显示问卷详情
- [x] 预览页：列出所有题目
- [x] 预览页：只读模式
- [x] 预览页：填写入口
- [x] 预览页：打印功能
- [x] 预览页：错误处理

### 后端部分（待实现）

- [ ] Schema：添加featured和pinned字段
- [ ] Service：getFeaturedQuestions()
- [ ] Service：getQuestionPreview()
- [ ] Service：countQuestions()
- [ ] Service：countAnswers()
- [ ] Service：setFeatured()
- [ ] Service：setPinned()
- [ ] Controller：API路由
- [ ] 权限验证：AdminGuard
- [ ] 数据库迁移脚本

---

## 🎓 核心设计要点

### 1. 优先级权重制度

```
不要硬编码顺序，使用权重制
pinned(1000) + featured(100) 的组合方式
允许灵活扩展更多标签
```

### 2. 题目统计的准确性

```
仔细区分"题目"和"填写项"
radio/checkbox = 题目 ✅
input/textarea = 输入框，不是题目 ❌
```

### 3. 数据一致性

```
答卷数依赖Answer表的完整性
定期验证统计数据的准确性
考虑建立统计缓存机制
```

### 4. 用户体验

```
从列表→预览→填写的逐步深入
预览页的完整性（看得全，看得清）
清晰的操作路径和回退方式
```

---

## 🔧 故障排除

### Q: 为什么题目数和实际不符？

A: 检查components中的type字段，确认过滤的填写类类型是否正确。

### Q: 置顶和推荐的优先级反了？

A: 检查排序逻辑，pinned(1000) 应该大于 featured(100)。

### Q: 答卷数一直是0？

A: 检查Answer表的questionId是否与Question表的\_id匹配。

### Q: 首页加载很慢？

A: 使用Redis缓存getFeaturedQuestions()的结果，设置5分钟过期。

---

## 📞 联系与支持

详细的实现代码和示例已在：

- `IMPLEMENTATION_PLAN.md` - 完整实现方案（包含所有代码示例）
- `BACKEND_IMPLEMENTATION.md` - 后端实现指南（包含NestJS代码）

前端代码已在以下文件中实现：

- `src/services/question.ts`
- `src/app/page.tsx`
- `src/app/question/[id]/preview.tsx`
