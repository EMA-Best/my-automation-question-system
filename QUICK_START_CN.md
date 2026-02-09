# 🚀 5分钟快速入门指南

> 从零开始实现热门问卷展示功能

---

## 📋 你需要知道的5件事

### 1️⃣ 这个功能做什么？

```
❌ 旧方式：硬编码3个问卷到首页
✅ 新方式：从后台数据库实时获取热门问卷
           显示置顶/推荐标签
           统计题目数和答卷数
           提供问卷预览功能
```

### 2️⃣ 前端已经完成什么？

```
✅ src/services/question.ts          → 2个新服务方法
✅ src/app/page.tsx                  → 首页改造完毕
✅ src/app/question/[id]/preview.tsx → 预览页创建完毕
```

### 3️⃣ 后端需要实现什么？

```
□ 数据库迁移：添加 featured/pinned 字段
□ API #1: GET /api/questions/featured       (获取热门问卷)
□ API #2: GET /api/questions/:id/preview    (获取问卷预览)
□ 其他：统计、排序、权限验证等
```

### 4️⃣ 核心概念

```
优先级排序：
  置顶(pinned) = 1000分
  推荐(featured) = 100分

  结果：
  置顶+推荐 = 1100分 ← 最优先展示
  仅置顶 = 1000分
  仅推荐 = 100分
  普通 = 0分 (不显示)

题目数统计：
  计入：radio(单选)、checkbox(多选)、select(下拉)
  排除：input、textarea、number、email等填写框

答卷数统计：
  查询Answer表，统计该问卷的答卷总数
```

### 5️⃣ 按照这个顺序做

```
第1步：数据库迁移 (MongoDB)
第2步：后端Service实现
第3步：后端Controller实现
第4步：本地测试
第5步：修复bug
第6步：部署上线
```

---

## 🎯 10分钟实现核心后端

### Step 1: 数据库迁移

```bash
# 连接你的MongoDB
mongosh

# 添加新字段
db.questions.updateMany(
  {},
  { $set: { featured: false, pinned: false } }
)

# 创建索引
db.questions.createIndex({ featured: 1, pinned: 1, publishedAt: -1 })
```

### Step 2: 复制Schema代码

从 `BACKEND_IMPLEMENTATION.md` 复制 `question.schema.ts` 代码到你的项目

关键字段：

```typescript
@Prop({ default: false })
featured: boolean;  // 新增

@Prop({ default: false })
pinned: boolean;    // 新增
```

### Step 3: 复制Service代码

从 `BACKEND_IMPLEMENTATION.md` 复制以下方法到 `question.service.ts`：

```typescript
✅ getFeaturedQuestions()    // 核心方法，最重要！
✅ getQuestionPreview()
✅ countQuestions()          // 计算题目数
✅ countAnswers()            // 统计答卷数
✅ setFeatured()
✅ setPinned()
✅ publishQuestion()
```

**关键实现：**

```typescript
// getFeaturedQuestions() 的伪代码
1. 查询: WHERE featured=true OR pinned=true AND status='published'
2. 遍历每个问卷:
   - 计算题目数: filter components，排除 input/textarea/number等
   - 统计答卷数: countDocuments({questionId})
3. 排序: 按权重(pinned*1000 + featured*100)降序
4. 返回数据
```

### Step 4: 复制Controller代码

从 `BACKEND_IMPLEMENTATION.md` 复制到 `question.controller.ts`

```typescript
✅ GET  /api/questions/featured
✅ GET  /api/questions/:id/preview
✅ GET  /api/questions/:id
✅ PATCH /api/questions/:id/admin/*
```

### Step 5: 测试API

```bash
# 测试热门问卷接口
curl -X GET http://localhost:3005/api/questions/featured

# 应该返回类似：
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "xxx",
      "title": "年轻人动漫偏好调查",
      "description": "...",
      "featured": true,
      "pinned": false,
      "questionCount": 10,
      "answerCount": 523,
      "publishedAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

## 🧪 快速验证清单

### 前端验证 ✅

```bash
npm run dev
# 访问 http://localhost:3000
# ✓ 首页应该显示动态问卷列表
# ✓ 问卷有置顶/推荐徽章
# ✓ 显示题目数和答卷数
# ✓ 可以点击进入预览页
# ✓ 预览页显示所有题目
# ✓ 预览页有"立即填写"按钮
```

### 后端验证 ✅

```bash
npm run start:dev
#
# ✓ GET /api/questions/featured  返回问卷列表
# ✓ GET /api/questions/:id/preview 返回问卷详情
# ✓ 数据包含 questionCount 和 answerCount
# ✓ 问卷按优先级排序
# ✓ 排除了填写类题目
```

---

## 💡 如果出错了？

### 首页显示"获取问卷列表失败"

```
原因：后端 /api/questions/featured 还没实现
解决：按照Step 1-5完成后端实现
```

### 答卷数一直是0

```
原因：Answer表中的questionId与问卷ID不匹配
解决：检查ID格式（ObjectId vs String）
```

### 题目数计算错误

```
原因：过滤规则有误
解决：检查 writeOnlyTypes 数组是否包含所有填写类型
      const writeOnlyTypes = ['input','textarea','number','email','url','date']
```

### 排序顺序反了

```
原因：权重计算错误
解决：确保 pinned(1000) > featured(100)
      sort((a, b) => {
        const pA = (a.pinned ? 1000 : 0) + (a.featured ? 100 : 0);
        const pB = (b.pinned ? 1000 : 0) + (b.featured ? 100 : 0);
        return pB - pA;  // 降序
      })
```

---

## 📚 文档导航

| 需求     | 查看文档                                               |
| -------- | ------------------------------------------------------ |
| 整体方案 | [SOLUTION_SUMMARY.md](SOLUTION_SUMMARY.md)             |
| 快速开始 | [QUICK_START.md](QUICK_START.md) ← 你在这里            |
| 详细实现 | [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)       |
| 后端指南 | [BACKEND_IMPLEMENTATION.md](BACKEND_IMPLEMENTATION.md) |
| 系统架构 | [ARCHITECTURE.md](ARCHITECTURE.md)                     |
| 代码变更 | [CHANGES_SUMMARY.md](CHANGES_SUMMARY.md)               |

---

## 🔥 核心代码片段速查

### 后端：getFeaturedQuestions()

```typescript
async getFeaturedQuestions() {
  // 1. 查询
  const questions = await this.questionModel
    .find({
      $or: [{ featured: true }, { pinned: true }],
      status: 'published',
    })
    .exec();

  // 2. 加工数据
  const result = await Promise.all(
    questions.map(async (q) => ({
      id: q._id.toString(),
      title: q.title,
      featured: q.featured,
      pinned: q.pinned,
      questionCount: this.countQuestions(q.components),
      answerCount: await this.countAnswers(q._id.toString()),
      publishedAt: q.publishedAt || q.createdAt,
    })),
  );

  // 3. 排序
  return result.sort((a, b) => {
    const priorityA = (a.pinned ? 1000 : 0) + (a.featured ? 100 : 0);
    const priorityB = (b.pinned ? 1000 : 0) + (b.featured ? 100 : 0);
    if (priorityA === priorityB) {
      return new Date(b.publishedAt).getTime() -
             new Date(a.publishedAt).getTime();
    }
    return priorityB - priorityA;
  });
}

// 辅助方法
private countQuestions(components: any[]): number {
  const writeOnlyTypes = ['input','textarea','number','email','url','date'];
  return components.filter(c => !writeOnlyTypes.includes(c.type)).length;
}

private async countAnswers(questionId: string): Promise<number> {
  return await this.answerModel
    .countDocuments({ questionId })
    .exec();
}
```

### 后端：getQuestionPreview()

```typescript
async getQuestionPreview(questionId: string) {
  const question = await this.questionModel.findById(questionId).exec();

  if (!question) {
    throw new NotFoundException(`问卷 ${questionId} 不存在`);
  }

  return {
    id: question._id.toString(),
    title: question.title,
    description: question.description,
    components: question.components || [],
    featured: question.featured,
    pinned: question.pinned,
    questionCount: this.countQuestions(question.components),
    answerCount: await this.countAnswers(questionId),
    createdAt: question.createdAt,
  };
}
```

### 后端：Controller路由

```typescript
@Get('featured')
async getFeaturedQuestions() {
  const data = await this.questionService.getFeaturedQuestions();
  return { code: 200, data };
}

@Get(':id/preview')
async getQuestionPreview(@Param('id') id: string) {
  const data = await this.questionService.getQuestionPreview(id);
  return { code: 200, data };
}
```

### 前端：首页调用

```typescript
async function QuestionList() {
  try {
    const res = await getFeaturedQuestions();
    const questions = res.data || [];

    return (
      <div className="space-y-4">
        {questions.map((question) => (
          <Link
            key={question.id}
            href={`/question/${question.id}/preview`}
          >
            <h3>{question.title}</h3>
            {question.pinned && <span>🔝 置顶</span>}
            {question.featured && <span>⭐ 推荐</span>}
            <div>📋 共{question.questionCount}个问题</div>
            <div>👥 已有{question.answerCount}人填写</div>
          </Link>
        ))}
      </div>
    );
  } catch (error) {
    return <div>获取问卷列表失败，请刷新重试</div>;
  }
}
```

---

## ⏱️ 时间预估

| 任务           | 时间       | 难度   |
| -------------- | ---------- | ------ |
| 理解架构       | 5分钟      | ⭐     |
| 数据库迁移     | 2分钟      | ⭐     |
| Schema更新     | 3分钟      | ⭐     |
| Service实现    | 15分钟     | ⭐⭐   |
| Controller实现 | 10分钟     | ⭐     |
| 本地测试       | 5分钟      | ⭐     |
| Bug修复        | 10分钟     | ⭐⭐⭐ |
| **总计**       | **50分钟** | -      |

---

## 🎓 学习要点

### 你会学到：

- ✅ 如何从数据库驱动UI
- ✅ 如何设计权重排序系统
- ✅ 如何实现复杂的统计功能
- ✅ 如何优雅地处理预览vs编辑
- ✅ Next.js异步组件的使用
- ✅ NestJS Service/Controller的最佳实践

### 关键技术点：

- MongoDB 查询和聚合
- Promise.all 并行数据加载
- 权重算法实现
- 类型安全的TypeScript
- React Server Components
- RESTful API设计

---

## 🎯 下一步

### 完成核心功能后可以继续优化：

```
第1阶段（必需）：
  ✅ 实现所有API
  ✅ 本地测试通过
  ✅ 部署上线

第2阶段（推荐）：
  □ 添加Redis缓存
  □ 性能索引优化
  □ 权限细化

第3阶段（高级）：
  □ 问卷浏览统计
  □ A/B测试（不同用户展示不同问卷）
  □ 问卷推荐算法
```

---

## 💬 常见提问

**Q: 为什么前端和后端分开实现？**
A: 前端可以独立工作，后端实现完毕后自动连通。这是解耦的最佳实践。

**Q: 能不能只用前端的缓存解决？**
A: 不能。数据需要从数据库实时获取，缓存只能优化频繁访问。

**Q: 如何处理A/B测试（不同用户不同排序）？**
A: 在 Service 中按用户ID添加排序规则，或使用推荐算法。

**Q: 能否扩展到多个标签（不只是置顶/推荐）？**
A: 完全可以。改进权重系统，添加更多字段即可。

---

## ✅ 准备好开始了吗？

```
✓ 理解了整体架构 ✓
✓ 知道要做什么   ✓
✓ 有代码示例可参考 ✓

👉 现在打开 BACKEND_IMPLEMENTATION.md 开始实现吧！
```

---

**祝你编码愉快！** 🚀

有任何问题可以参考：

- 📖 [详细实现方案](IMPLEMENTATION_PLAN.md)
- 🏗️ [系统架构图](ARCHITECTURE.md)
- 📝 [代码变更汇总](CHANGES_SUMMARY.md)
