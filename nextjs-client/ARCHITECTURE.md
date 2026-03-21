# 系统架构图与数据流

## 🏗️ 整体系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户浏览器                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      Next.js 前端                       │   │
│  │                                                         │   │
│  │  ┌──────────────────┐          ┌──────────────────┐   │   │
│  │  │   首页          │          │   预览页         │   │   │
│  │  │ page.tsx        │          │ [id]/preview.tsx │   │   │
│  │  │                │          │                  │   │   │
│  │  │ ✅ 渲染问卷列表│ ──→ 点击  │ ✅ 显示详情     │   │   │
│  │  │ ✅ 徽章+统计   │ [id]     │ ✅ 所有题目     │   │   │
│  │  └──────────────────┘          │ ✅ 提供填写链接 │   │   │
│  │                                 └──────────────────┘   │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │      Services Layer (question.ts)              │   │   │
│  │  │                                                 │   │   │
│  │  │ ✅ getQuestionById()                           │   │   │
│  │  │ ✅ getFeaturedQuestions() [新增]              │   │   │
│  │  │ ✅ getQuestionPreview() [新增]                │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                        ↓ HTTP GET                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                         ↓ fetch                                  │
└─────────────────────────────────────────────────────────────────┘
          ↓                                          ↓
   API请求                                   浏览器存储
          ↓                                          ↓
     [跨域问题]                          sessionStorage
                                                    ↓
                                            缓存问卷数据

┌─────────────────────────────────────────────────────────────────┐
│                       NestJS 后端                                │
│  HTTP://localhost:3005                                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐      │
│  │           Question Controller                        │      │
│  │                                                      │      │
│  │  GET  /api/questions/featured     ┐               │      │
│  │  GET  /api/questions/:id/preview  │ 6个API        │      │
│  │  GET  /api/questions/:id          │ 路由          │      │
│  │  PATCH /api/questions/:id/admin/* │               │      │
│  │                                   └───→ Service   │      │
│  └──────────────────────────────────────────────────────┘      │
│                        ↓                                        │
│  ┌──────────────────────────────────────────────────────┐      │
│  │           Question Service                          │      │
│  │                                                      │      │
│  │  核心方法：                                         │      │
│  │  ✅ getFeaturedQuestions()                          │      │
│  │     - 查询featured=true或pinned=true的问卷         │      │
│  │     - 计算每个问卷的题目数                         │      │
│  │     - 统计每个问卷的答卷数                         │      │
│  │     - 按优先级排序                                 │      │
│  │     - 返回统计数据                                 │      │
│  │                                                      │      │
│  │  ✅ getQuestionPreview(id)                          │      │
│  │     - 返回单个问卷的完整信息                        │      │
│  │     - 包含所有components和统计                     │      │
│  │                                                      │      │
│  │  助手方法：                                         │      │
│  │  ✅ countQuestions()    - 计算题目数                │      │
│  │  ✅ countAnswers()      - 统计答卷数                │      │
│  │  ✅ setFeatured()       - 设置推荐                  │      │
│  │  ✅ setPinned()         - 设置置顶                  │      │
│  │                                                      │      │
│  └──────────────────────────────────────────────────────┘      │
│                        ↓                                        │
│  ┌──────────────────────────────────────────────────────┐      │
│  │            Data Access (Mongoose)                   │      │
│  │                                                      │      │
│  │  this.questionModel.find({...})                    │      │
│  │  this.answerModel.countDocuments({...})             │      │
│  │                                                      │      │
│  └──────────────────────────────────────────────────────┘      │
│                        ↓                                        │
└─────────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                    MongoDB 数据库                               │
│  mongodb://localhost:27017                                     │
│                                                                │
│  ┌──────────────────────┐      ┌──────────────────────┐       │
│  │  questions           │      │  answers             │       │
│  │  Collection          │      │  Collection          │       │
│  │                      │      │                      │       │
│  │  {                   │      │  {                   │       │
│  │    _id: ObjectId     │      │    _id: ObjectId     │       │
│  │    title: string     │      │    questionId: ref   │◄──┐   │
│  │    description       │      │    answers: array    │   │   │
│  │    components[]      │      │    submittedAt       │   │   │
│  │    ✅featured        │      │  }                   │   │   │
│  │    ✅pinned          │      │                      │   │   │
│  │    publishedAt       │      └──────────────────────┘   │   │
│  │    status            │                                 │   │
│  │    createdAt         │                                 │   │
│  │    updatedAt         │                                 │   │
│  │  }                   │                    关联关系 ─────┘   │
│  │                      │                                     │
│  │ 索引: featured,      │                                     │
│  │      pinned,         │                                     │
│  │      publishedAt     │                                     │
│  └──────────────────────┘                                     │
│                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 数据流图

### 1️⃣ 用户访问首页 - 获取热门问卷列表

```
用户访问首页 (/)
      ↓
前端组件加载
      ↓
调用 getFeaturedQuestions()
      ↓
HTTP GET /api/questions/featured
      ↓
后端 Question.Controller
  GET /api/questions/featured
      ↓
this.questionService.getFeaturedQuestions()
      ↓
┌─────────────────────────────────────────┐
│ 1. 查询数据库                           │
│    db.questions.find({               │
│      $or: [                           │
│        {featured: true},              │
│        {pinned: true}                 │
│      ],                               │
│      status: 'published'              │
│    })                                 │
│                                       │
│ 2. 遍历每个问卷计算题目数             │
│    countQuestions(components)        │
│    - 过滤掉 input/textarea/number等  │
│    - 只计算 radio/checkbox/select等  │
│                                       │
│ 3. 查询Answer表统计答卷数             │
│    countDocuments({questionId: id})  │
│                                       │
│ 4. 构建响应对象                       │
│    {                                  │
│      id, title, description,         │
│      featured, pinned,               │
│      questionCount,   ← 计算结果     │
│      answerCount,     ← 查询结果     │
│      publishedAt                     │
│    }                                  │
│                                       │
│ 5. 排序问卷                           │
│    priority = pinned(1000) +         │
│               featured(100)          │
│    排序规则：                          │
│      权重高 → 权重低                 │
│      同权重 → 按时间倒序              │
└─────────────────────────────────────────┘
      ↓
返回JSON数据
      ↓
前端接收数据
      ↓
渲染问卷列表
  ├─ 问卷标题
  ├─ 问卷描述
  ├─ 推荐/置顶徽章
  │  ├─ {pinned} 🔝 置顶
  │  └─ {featured} ⭐ 推荐
  └─ 统计信息
     ├─ 📋 共{questionCount}个问题
     └─ 👥 已有{answerCount}人填写
      ↓
渲染完成，用户看到首页
```

---

### 2️⃣ 用户点击问卷 - 进入预览页

```
用户点击问卷列表中的某个问卷
      ↓
跳转到 /question/[id]/preview?id=65a1b2c3d4e5f6g7...
      ↓
前端 [id]/preview.tsx 页面组件加载
      ↓
调用 getQuestionPreview(id)
      ↓
HTTP GET /api/questions/:id/preview
      ↓
后端 Question.Controller
  GET /api/questions/:id/preview
      ↓
this.questionService.getQuestionPreview(id)
      ↓
┌─────────────────────────────────────────┐
│ 1. 根据ID查询问卷                      │
│    db.questions.findById(id)         │
│                                       │
│ 2. 检查问卷是否存在                   │
│    if (!question) throw 404          │
│                                       │
│ 3. 计算题目数                         │
│    countQuestions(components)       │
│                                       │
│ 4. 统计答卷数                         │
│    countAnswers(id)                 │
│                                       │
│ 5. 构建完整响应                       │
│    {                                  │
│      id, title, description,         │
│      components: [...],  ← 关键     │
│      featured, pinned,              │
│      questionCount,                 │
│      answerCount,                   │
│      createdAt                      │
│    }                                  │
└─────────────────────────────────────────┘
      ↓
返回问卷完整数据（包括components）
      ↓
前端接收数据
      ↓
渲染问卷预览页
  ├─ 问卷头部信息
  │  ├─ 标题
  │  ├─ 描述
  │  └─ 置顶/推荐徽章
  │
  ├─ 统计信息卡片
  │  ├─ 题目数: {questionCount}
  │  ├─ 答卷数: {answerCount}
  │  └─ 发布日期: {createdAt}
  │
  ├─ 预览提示条
  │  └─ 💡 这是预览页面，无法编辑
  │
  ├─ 操作按钮
  │  ├─ [立即填写] → /question/[id]
  │  └─ [打印预览] → window.print()
  │
  └─ 问卷内容
     ├─ 题目 #1
     │  ├─ 题号: 1
     │  ├─ 题目: "您最喜欢的动漫类型？"
     │  ├─ 题型: 单选题
     │  └─ 选项:
     │     ├─ ○ 热血战斗
     │     ├─ ○ 恋爱向
     │     ├─ ○ 悬疑推理
     │     └─ ○ 日常搞笑
     │
     ├─ 题目 #2
     │  ├─ 题号: 2
     │  ├─ 题目: "您曾观看过...？"
     │  ├─ 题型: 多选题
     │  └─ 选项:
     │     ├─ ☑ 进击的巨人
     │     ├─ ☐ 死神
     │     ├─ ☐ 火影忍者
     │     └─ ☐ 海贼王
     │
     └─ 题目 #3
        ├─ 题号: 3
        ├─ 题目: "请分享您的看法"
        ├─ 题型: 长文本
        └─ 输入框 [禁用 - 预览模式]
      ↓
渲染完成，用户可以：
  - 查看问卷内容
  - 点击"立即填写"编辑
  - 打印预览
  - 返回首页
```

---

### 3️⃣ 管理员设置推荐/置顶

```
管理员访问后台管理界面
      ↓
选择某个问卷
      ↓
点击"设为推荐"或"设为置顶"
      ↓
前端调用管理员API
  PATCH /api/questions/[id]/admin/featured
  或
  PATCH /api/questions/[id]/admin/pinned
  ↓
  Body: { featured: true } 或 { pinned: true }
  Header: Authorization: Bearer {token}
      ↓
后端 Question.Controller
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/admin/featured')
      ↓
权限验证
  ✅ 是否有有效JWT token?
  ✅ 是否拥有admin角色?
      ↓
if (!authUser.isAdmin)
  throw ForbiddenException
      ↓
this.questionService.setFeatured(id, featured)
      ↓
db.questions.findByIdAndUpdate(
  id,
  { featured: true/false },
  { new: true }
)
      ↓
返回更新后的问卷对象
      ↓
前端显示"设置成功"提示
      ↓
（可选）刷新问卷列表或清除缓存
      ↓
下次用户访问首页时，会看到更新后的问卷排序
```

---

## 🔄 状态图

### 问卷的生命周期

```
创建草稿
  │
  ├─ status: 'draft'
  ├─ featured: false
  ├─ pinned: false
  ↓
发布
  │
  ├─ status: 'published'
  ├─ publishedAt: now()
  │  featured: false
  │  pinned: false
  ↓
   │
   ├─ 管理员操作：设为推荐
   │  └─ featured: true
   │     pinned: false
   │     权重: 100
   │
   ├─ 管理员操作：设为置顶
   │  └─ featured: false
   │     pinned: true
   │     权重: 1000
   │
   ├─ 管理员操作：既推荐又置顶
   │  └─ featured: true
   │     pinned: true
   │     权重: 1100 ← 最优先级
   │
   └─ 管理员操作：取消推荐/置顶
      └─ featured: false
         pinned: false
         权重: 0

首页问卷列表排序
  │
  ├─ [权重1100] 既置顶又推荐的问卷 ← 最先展示
  ├─ [权重1100] 既置顶又推荐的问卷 (同权重按时间倒序)
  ├─ [权重1000] 仅置顶的问卷
  ├─ [权重1000] 仅置顶的问卷
  ├─ [权重100]  仅推荐的问卷
  ├─ [权重100]  仅推荐的问卷
  └─ [权重0]    普通问卷（不展示）
```

---

## 📈 题目统计流程图

```
问卷components数组
  │
  ├─ {id: "1", type: "radio", ...}           ✅ 计入
  ├─ {id: "2", type: "checkbox", ...}        ✅ 计入
  ├─ {id: "3", type: "select", ...}          ✅ 计入
  ├─ {id: "4", type: "textarea", ...}        ❌ 排除（填写类）
  ├─ {id: "5", type: "input", ...}           ❌ 排除（填写类）
  ├─ {id: "6", type: "number", ...}          ❌ 排除（填写类）
  ├─ {id: "7", type: "email", ...}           ❌ 排除（填写类）
  ├─ {id: "8", type: "url", ...}             ❌ 排除（填写类）
  ├─ {id: "9", type: "date", ...}            ❌ 排除（填写类）
  ├─ {id: "10", type: "paragraph", ...}      ✅ 计入（说明文字）
  └─ {id: "11", type: "description", ...}    ✅ 计入（说明文字）
  │
  ↓ countQuestions(components)
  │
  → 过滤：components.filter(c =>
      !['input','textarea','number','email','url','date'].includes(c.type)
    )
  │
  ↓
  → 结果数组: [1, 2, 3, 10, 11]
  │
  ↓
  → 计数: length = 5
  │
  ↓
questionCount = 5
```

---

## 💾 答卷统计流程图

```
提交答卷流程 (不在本功能范围，但需要理解)
  │
  用户填写问卷并提交
  ├─ POST /api/answer
  └─ Body: {
       questionId: "65a1b2c3d4e5f6g7...",
       answerList: [...]
     }
      │
      ↓
  创建Answer文档
  ├─ _id: ObjectId
  ├─ questionId: ObjectId (关联到问卷)
  ├─ answers: [...]
  ├─ submittedAt: Date.now()
  └─ 保存到MongoDB
  │
  ↓
  ┌─────────────────────────────┐
  │ Answer 集合示例              │
  │                             │
  │ {questionId: "65a1b2c.."}  │  ← Answer #1
  │ {questionId: "65a1b2c.."}  │  ← Answer #2
  │ {questionId: "65a1b2c.."}  │  ← Answer #3
  │ {questionId: "65a1b2c.."}  │  ← Answer #4
  │ {questionId: "65a1b2c.."}  │  ← Answer #5
  │ ...                         │
  │ {questionId: "65a1b2c.."}  │  ← Answer #523
  │                             │
  └─────────────────────────────┘
      │
      ↓ countAnswers(questionId)
      │
      → db.answers.countDocuments({
          questionId: "65a1b2c..."
        })
      │
      ↓
      → 返回: 523
      │
      ↓
answerCount = 523
```

---

## 🔗 API调用链

### 首页 → 热门问卷 → 预览 → 编辑 的完整链路

```
用户行为                    前端调用                   后端API                   数据库操作

访问首页 (/)
    │
    └─ getFeaturedQuestions() ──> GET /api/questions/featured
                                        │
                                        ├─ Find questions WHERE featured=true OR pinned=true
                                        ├─ For each question:
                                        │  ├─ countQuestions(components)
                                        │  └─ countDocuments answers
                                        └─ Return: [
                                             {id, title, featured, pinned,
                                              questionCount, answerCount}
                                           ]
    │
    └─ 渲染问卷列表
    │

点击某问卷 (Link to /question/[id]/preview)
    │
    └─ getQuestionPreview(id) ──> GET /api/questions/:id/preview
                                        │
                                        ├─ FindById questions
                                        ├─ countQuestions(components)
                                        ├─ countDocuments answers
                                        └─ Return: {
                                             id, title, description,
                                             components: [...],
                                             featured, pinned,
                                             questionCount, answerCount
                                           }
    │
    └─ 渲染问卷预览页
       ├─ 显示问卷详情
       └─ 显示所有题目
    │

点击"立即填写" (Link to /question/[id])
    │
    └─ getQuestionById(id) ──> GET /api/questions/:id
                                    │
                                    └─ FindById questions
                                       Return: {full question object}
    │
    └─ 渲染问卷编辑页
       ├─ 显示填写表单
       └─ 提交按钮
    │

用户填写并提交
    │
    └─ postAnswer(answerInfo) ──> POST /api/answer
                                    │
                                    └─ Create answer record
                                       Save to MongoDB
    │
    └─ 跳转成功页面
```

---

## 📚 数据库关系图

```
┌──────────────────────────┐         ┌──────────────────────────┐
│      Questions           │ 1    │  Answers                 │
│     Collection           │ : M  │  Collection              │
├──────────────────────────┤      ├──────────────────────────┤
│ _id: ObjectId ├──────────┼──────→ _id: ObjectId            │
│ title         │ (PK)     │ (FK)  │ questionId: ObjectId ────┤
│ description   │          │       │ answers: Array           │
│ components[]  │          │       │ submittedAt: Date        │
│   - id        │          │       │                          │
│   - type      │          │       │ 示例关系：                │
│   - label     │          │       │ 1个Question对应          │
│   - options[] │          │       │ 多个Answer               │
│ featured      │          │       │                          │
│ pinned        │          │       │ Answer #1 ┐              │
│ publishedAt   │          │       │ Answer #2 │              │
│ status        │          │       │ ...       ├─ 都指向      │
│ createdAt     │          │       │ Answer #N │ 同一个       │
│ updatedAt     │          │       │           ┘ Question     │
│ createdBy     │          │       │                          │
└──────────────────────────┘       └──────────────────────────┘

查询示例：
─────────────────────────────────────────────────────────
1. 获取热门问卷
   db.questions.find({featured: true, status: 'published'})

2. 对于每个问卷，统计答卷数
   db.answers.countDocuments({questionId: question._id})

3. JOIN式查询 (伪代码)
   FOR EACH question IN featured_questions:
     question.answerCount = COUNT(answers WHERE answers.questionId = question._id)
```

---

## 🎯 优先级排序示例

```
输入数据（乱序）：
┌─────────────────────────────────────────────────────────────┐
│ Question #1: title="A", pinned=false, featured=true         │
│ Question #2: title="B", pinned=true,  featured=false        │
│ Question #3: title="C", pinned=true,  featured=true         │
│ Question #4: title="D", pinned=false, featured=true         │
│ Question #5: title="E", pinned=false, featured=false        │
└─────────────────────────────────────────────────────────────┘

计算权重：
┌─────────────────────────────────────────────────────────────┐
│ Question #1: weight = 0 + 100 = 100   (仅推荐)             │
│ Question #2: weight = 1000 + 0 = 1000 (仅置顶)             │
│ Question #3: weight = 1000 + 100 = 1100 (置顶+推荐)       │
│ Question #4: weight = 0 + 100 = 100   (仅推荐)             │
│ Question #5: weight = 0 + 0 = 0       (普通，不展示)      │
└─────────────────────────────────────────────────────────────┘

排序（降序）：
┌─────────────────────────────────────────────────────────────┐
│ [1] Question #3: weight=1100 (置顶+推荐)                    │ ← 最优先
│ [2] Question #2: weight=1000 (仅置顶)                       │
│ [3] Question #1: weight=100  (仅推荐)                       │
│ [4] Question #4: weight=100  (仅推荐，时间较新则较前)      │
│ ❌  Question #5: weight=0    (不展示)                       │
└─────────────────────────────────────────────────────────────┘

输出结果：
按上述顺序在首页渲染

[题目1]【🔝置顶 ⭐推荐】 C - 最新发布的热门问卷
[题目2]【🔝置顶】 B - 置顶的问卷
[题目3]【⭐推荐】 A - 推荐的问卷
[题目4]【⭐推荐】 D - 另一个推荐的问卷（时间较旧）
```

---

这样用户就能一目了然地理解整个系统的架构和数据流动了！
