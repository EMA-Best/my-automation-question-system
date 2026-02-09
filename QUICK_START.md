# 快速实现清单

## 📋 前端部分（已完成 ✅）

### 1. 服务层 - `src/services/question.ts`

```typescript
✅ getQuestionById(id)          // 获取完整问卷
✅ getFeaturedQuestions()        // 获取热门问卷列表（新增）
✅ getQuestionPreview(id)        // 获取问卷预览（新增）
```

### 2. 首页 - `src/app/page.tsx`

```typescript
✅ 导入 getFeaturedQuestions
✅ 创建 QuestionList 异步组件
✅ 动态渲染问卷列表
✅ 添加 pinned/featured 徽章
✅ 显示统计信息（题目数/答卷数）
✅ 链接到 /question/[id]/preview
✅ 错误处理
```

### 3. 预览页 - `src/app/question/[id]/preview.tsx`（新增 ✅）

```typescript
✅ 获取问卷预览信息
✅ 显示问卷基本信息和统计数据
✅ 列出所有题目
✅ 区分题型显示
✅ 只读预览模式
✅ 提供"立即填写"按钮
✅ 支持打印功能
✅ 错误处理和404
```

---

## 🛠️ 后端部分（待实现）

### Step 1: 数据库迁移

```bash
# 连接MongoDB并执行
mongosh

# 添加新字段到现有文档
db.questions.updateMany(
  {},
  { $set: { featured: false, pinned: false } }
)

# 创建性能索引
db.questions.createIndex({
  featured: 1,
  pinned: 1,
  publishedAt: -1
})
```

### Step 2: 更新Schema

复制 `BACKEND_IMPLEMENTATION.md` 中的 `question.schema.ts` 代码到你的项目：

```typescript
// src/schemas/question.schema.ts
// 添加 featured 和 pinned 字段
```

### Step 3: 实现Service

复制 `BACKEND_IMPLEMENTATION.md` 中的以下方法到 `src/modules/question/question.service.ts`：

#### 核心方法

```typescript
async getFeaturedQuestions()      // 获取热门问卷列表 (7个方法中最核心)
async getQuestionPreview()        // 获取问卷预览
async getQuestion()               // 获取完整问卷
async setFeatured()               // 管理员：设置推荐
async setPinned()                 // 管理员：设置置顶
async publishQuestion()           // 管理员：发布问卷

private countQuestions()          // 计算题目数
private countAnswers()            // 计算答卷数
```

### Step 4: 实现Controller

复制 `BACKEND_IMPLEMENTATION.md` 中的代码到 `src/modules/question/question.controller.ts`：

#### 需要实现的API

```
✅ GET  /api/questions/featured
   - 返回热门问卷列表（公开）
   - 包含推荐/置顶徽章和统计数据

✅ GET  /api/questions/:id/preview
   - 返回问卷预览信息（公开）
   - 包含所有题目和统计数据

✅ GET  /api/questions/:id
   - 返回完整问卷（可能需要权限）
   - 包含所有编辑信息

✅ PATCH /api/questions/:id/admin/featured
   - 管理员：设置推荐标签（需要权限验证）
   - Body: { featured: boolean }

✅ PATCH /api/questions/:id/admin/pinned
   - 管理员：设置置顶标签（需要权限验证）
   - Body: { pinned: boolean }

✅ PATCH /api/questions/:id/admin/publish
   - 管理员：发布问卷（需要权限验证）
```

### Step 5: 模块配置

更新或创建 `src/modules/question/question.module.ts`：

```typescript
// 导入QuestionSchema和AnswerSchema
// 配置MongooseModule
// 导出QuestionService
```

### Step 6: 测试API

```bash
# 测试获取热门问卷
curl -X GET http://localhost:3005/api/questions/featured

# 测试获取问卷预览
curl -X GET http://localhost:3005/api/questions/{questionId}/preview

# 测试管理员设置推荐（需要token）
curl -X PATCH http://localhost:3005/api/questions/{questionId}/admin/featured \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"featured": true}'
```

---

## 🎯 优先级排序规则（关键）

```typescript
// 权重计算
priority = (pinned ? 1000 : 0) + (featured ? 100 : 0)

// 排序顺序
1. pinned: true,  featured: true   → 权重1100 ← 最优先
2. pinned: true,  featured: false  → 权重1000
3. pinned: false, featured: true   → 权重100
4. pinned: false, featured: false  → 权重0    (不会出现)

// 同权重下按publishedAt降序（新→旧）
```

---

## 📊 题目统计规则（重要）

### 排除的类型（填写类）

```
❌ 'input'
❌ 'textarea'
❌ 'number'
❌ 'email'
❌ 'url'
❌ 'date'
```

### 计入的类型（问卷题）

```
✅ 'radio'        (单选)
✅ 'checkbox'     (多选)
✅ 'select'       (下拉选)
✅ 'paragraph'    (段落说明)
✅ 'description'  (描述文字)
```

---

## 🔄 前后端交互顺序

### 首页加载流程

```
1. 用户访问首页
2. 前端调用 getFeaturedQuestions()
3. 后端查询featured=true或pinned=true的问卷
4. 后端计算每个问卷的题目数（排除填写类）
5. 后端查询Answer表统计答卷数
6. 后端按权重排序返回数据
7. 前端渲染问卷列表 + 徽章 + 统计
```

### 问卷预览流程

```
1. 用户点击某个问卷
2. 跳转到 /question/{id}/preview
3. 前端调用 getQuestionPreview(id)
4. 后端返回问卷完整信息 + components
5. 前端渲染问卷详情 + 所有题目
6. 用户可以预览，也可以点击"立即填写"进入编辑页
```

---

## 📝 示例数据

### MongoDB中的问卷示例

```json
{
  "_id": ObjectId("65a1b2c3d4e5f6g7h8i9j0k1"),
  "title": "年轻人动漫偏好调查",
  "description": "了解年轻人对不同类型动漫的偏好和观看习惯",
  "featured": true,
  "pinned": false,
  "components": [
    {
      "id": "comp_1",
      "type": "radio",
      "label": "您最喜欢的动漫类型？",
      "options": [{"label": "热血", "value": "action"}, ...]
    },
    {
      "id": "comp_2",
      "type": "checkbox",
      "label": "您看过以下哪些动漫？",
      "options": [...]
    },
    {
      "id": "comp_3",
      "type": "textarea",
      "label": "其他看法（可选）"
    }
  ],
  "status": "published",
  "publishedAt": ISODate("2024-01-15T10:00:00Z"),
  "createdAt": ISODate("2024-01-15T10:00:00Z"),
  "updatedAt": ISODate("2024-01-15T10:00:00Z")
}
```

### API响应示例

```json
GET /api/questions/featured

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
      "questionCount": 2,        // 只计算radio和checkbox，不计textarea
      "answerCount": 523,        // Answer表中该问卷的总数
      "publishedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

## ✅ 完整实现检查表

### 前端（已完成）

- [x] getFeaturedQuestions() 服务
- [x] getQuestionPreview() 服务
- [x] 首页动态渲染列表
- [x] 预览页实现
- [x] 错误处理
- [x] UI美化（徽章、统计等）

### 后端（待完成）

- [ ] 数据库迁移（添加featured/pinned）
- [ ] Schema更新
- [ ] Service实现（getFeaturedQuestions等）
- [ ] Controller实现（6个API）
- [ ] 权限验证（AdminGuard）
- [ ] 模块配置
- [ ] 测试验证

### 优化项

- [ ] Redis缓存热门问卷列表
- [ ] 数据库复合索引
- [ ] 查询字段投影优化
- [ ] 异步统计加载

---

## 🚀 快速开始

### 前端立即可用

```bash
# 所有前端代码已实现，直接可以运行
npm run dev

# 首页会调用 /api/questions/featured
# 如果后端未实现，会显示"获取问卷列表失败"
```

### 后端实现步骤

```bash
# 1. 数据库迁移
# 2. 复制Schema代码
# 3. 复制Service代码
# 4. 复制Controller代码
# 5. 配置Module
# 6. 重启后端服务
# 7. 测试API

npm run start:dev
curl http://localhost:3005/api/questions/featured
```

---

## 📚 关键文档

| 文档                        | 说明                      |
| --------------------------- | ------------------------- |
| `SOLUTION_SUMMARY.md`       | 📋 完整方案总结（本总结） |
| `IMPLEMENTATION_PLAN.md`    | 📝 详细实现方案和代码示例 |
| `BACKEND_IMPLEMENTATION.md` | 🛠️ NestJS后端完整实现指南 |

---

## 💡 关键点提示

### ⭐ 最容易出错的地方

1. **题目统计**
   - 记住排除 input/textarea/number/email/url/date
   - 只计算真正的"题目"（radio/checkbox/select等）

2. **优先级排序**
   - pinned(1000) 一定要大于 featured(100)
   - 同权重下按时间倒序

3. **答卷统计**
   - 必须查Answer表，不能查components
   - questionId要与\_id对应

4. **API端口**
   - 前端: http://localhost:3000
   - 后端: http://localhost:3005
   - 确保后端PORT配置正确

5. **预览vs编辑**
   - 预览：/question/[id]/preview（GET /api/questions/:id/preview）
   - 编辑：/question/[id]（GET /api/questions/:id）
   - 两个不同的路由和API

### 🎯 实现优先级

```
第1优先 ⭐⭐⭐⭐⭐
  - 数据库Schema (featured/pinned)
  - Service: getFeaturedQuestions()
  - Controller: GET /api/questions/featured

第2优先 ⭐⭐⭐⭐
  - Service: getQuestionPreview()
  - Controller: GET /api/questions/:id/preview

第3优先 ⭐⭐⭐
  - 管理员接口 (setFeatured/setPinned)
  - 权限验证

第4优先 ⭐⭐
  - 缓存优化
  - 索引优化
```

---

## 🔗 快速跳转

需要查看具体代码？

- 前端服务代码 → [src/services/question.ts](src/services/question.ts)
- 首页代码 → [src/app/page.tsx](src/app/page.tsx)
- 预览页代码 → [src/app/question/[id]/preview.tsx](src/app/question/[id]/preview.tsx)

需要查看完整实现？

- 详细方案 → [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
- 后端指南 → [BACKEND_IMPLEMENTATION.md](BACKEND_IMPLEMENTATION.md)
