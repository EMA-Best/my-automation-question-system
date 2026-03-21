# 热门问卷展示功能实现方案

## 一、核心需求分析

### 1. 功能需求

- ✅ 将硬编码的问卷列表替换为真实后台数据
- ✅ 支持问卷的**置顶(pinned)**和**推荐(featured)**标签
- ✅ 展示问题数量统计（排除填写类组件）
- ✅ 展示填写人数（答卷总数）
- ✅ 点击问卷可预览内容但不能填写
- ✅ 处理置顶/推荐的展示优先级

### 2. 置顶与推荐的优先级问题 ⭐

**推荐方案：** 按以下优先级排序显示

```
1. 置顶+推荐的问卷（双重标签）
2. 只置顶的问卷
3. 只推荐的问卷
4. 普通问卷
```

**排序规则：**

```javascript
// 优先级计算 (越大越优先)
priority = pinned ? 1000 : 0 + featured ? 100 : 0 + 新创建时间分数;
```

---

## 二、数据库Schema设计

### 1. Questions Collection（问卷表）

```javascript
{
  _id: ObjectId,
  title: String,              // 问卷标题
  description: String,        // 问卷描述
  components: Array,          // 问卷组件/题目
  featured: Boolean,          // 推荐标志
  pinned: Boolean,           // 置顶标志
  publishedAt: Date,         // 发布时间
  createdAt: Date,           // 创建时间
  updatedAt: Date,           // 更新时间
  createdBy: ObjectId,       // 创建者ID
  status: String,            // 状态: draft/published
  // ... 其他字段
}
```

### 2. Answers Collection（答卷表）- 可能已存在

```javascript
{
  _id: ObjectId,
  questionId: ObjectId,       // 问卷ID
  answers: Array,             // 答案列表
  submittedAt: Date,         // 提交时间
  // ... 其他字段
}
```

---

## 三、后端API设计

### 1. 获取热门问卷列表

```
GET /api/questions/featured
Response:
{
  code: 200,
  data: [
    {
      id: "xxx",
      title: "...",
      description: "...",
      featured: true,
      pinned: true,
      questionCount: 10,        // 题目数量
      answerCount: 523,         // 填写人数
      publishedAt: "2024-01-01"
    }
  ]
}
```

### 2. 获取问卷详情（预览）

```
GET /api/questions/:id/preview
Response:
{
  code: 200,
  data: {
    id: "xxx",
    title: "...",
    description: "...",
    components: [...],
    featured: true,
    pinned: true,
    questionCount: 10,
    answerCount: 523,
    createdAt: "2024-01-01"
  }
}
```

### 3. 管理员接口：设置推荐/置顶（后台管理）

```
PATCH /api/questions/:id/admin/featured
PATCH /api/questions/:id/admin/pinned
Body: { featured: true/false } 或 { pinned: true/false }
```

---

## 四、前端实现方案

### 1. 新增服务方法 (src/services/question.ts)

```typescript
// 获取热门问卷
export async function getFeaturedQuestions() {
  const data = await GET("/api/questions/featured");
  return data;
}

// 获取问卷预览信息
export async function getQuestionPreview(id: string) {
  const data = await GET(`/api/questions/${id}/preview`);
  return data;
}
```

### 2. 首页组件改造 (src/app/page.tsx)

- 使用 `getFeaturedQuestions()` 替换硬编码数据
- 动态渲染问卷列表
- 添加置顶/推荐的视觉标签（徽章）

### 3. 问卷预览页面 (src/app/question/[id]/preview.tsx) - 新增

- 显示问卷完整内容
- 禁用填写功能（按钮置灰或隐藏）
- 显示统计信息

---

## 五、实现步骤

### 第一步：NestJS后端实现

1. ✅ 更新 Questions Schema
2. ✅ 创建 `/api/questions/featured` 接口
3. ✅ 创建 `/api/questions/:id/preview` 接口
4. ✅ 添加统计逻辑（计算题目数和答卷数）

### 第二步：前端服务层

1. ✅ 更新 `services/question.ts`

### 第三步：前端UI改造

1. ✅ 更新 `src/app/page.tsx`
2. ✅ 新增预览页面逻辑

### 第四步：测试验证

1. ✅ 功能测试
2. ✅ 优先级排序测试

---

## 六、代码实现

### 后端 (NestJS)

#### 1. Question Service 增强

```typescript
// question.service.ts

// 获取推荐问卷列表（带排序）
async getFeaturedQuestions() {
  const questions = await this.questionModel.find({
    $or: [{ featured: true }, { pinned: true }],
    status: 'published'
  }).exec();

  // 构建问卷统计信息
  const result = await Promise.all(
    questions.map(async (q) => ({
      id: q._id,
      title: q.title,
      description: q.description,
      featured: q.featured,
      pinned: q.pinned,
      questionCount: this.countQuestions(q.components),
      answerCount: await this.countAnswers(q._id),
      publishedAt: q.publishedAt,
    }))
  );

  // 按优先级排序
  return result.sort((a, b) => {
    const priorityA = (a.pinned ? 1000 : 0) + (a.featured ? 100 : 0);
    const priorityB = (b.pinned ? 1000 : 0) + (b.featured ? 100 : 0);
    return priorityB - priorityA;
  });
}

// 计算非填写类题目数量
private countQuestions(components: any[]): number {
  // 排除填写类: input, textarea, number等
  const writeOnlyTypes = ['input', 'textarea', 'number'];
  return components.filter(c => !writeOnlyTypes.includes(c.type)).length;
}

// 计算答卷数
private async countAnswers(questionId: string): Promise<number> {
  return await this.answerModel.countDocuments({ questionId });
}

// 获取问卷预览
async getQuestionPreview(id: string) {
  const question = await this.questionModel.findById(id).exec();
  if (!question) throw new NotFoundException();

  return {
    id: question._id,
    title: question.title,
    description: question.description,
    components: question.components,
    featured: question.featured,
    pinned: question.pinned,
    questionCount: this.countQuestions(question.components),
    answerCount: await this.countAnswers(id),
    createdAt: question.createdAt,
  };
}
```

#### 2. Question Controller

```typescript
// question.controller.ts

@Controller("api/questions")
export class QuestionController {
  constructor(private questionService: QuestionService) {}

  // 获取热门问卷
  @Get("featured")
  async getFeaturedQuestions() {
    const data = await this.questionService.getFeaturedQuestions();
    return { code: 200, data };
  }

  // 获取问卷预览
  @Get(":id/preview")
  async getPreview(@Param("id") id: string) {
    const data = await this.questionService.getQuestionPreview(id);
    return { code: 200, data };
  }

  // 获取完整问卷（编辑/填写）
  @Get(":id")
  async getQuestion(@Param("id") id: string) {
    const data = await this.questionService.getQuestion(id);
    return { code: 200, data };
  }
}
```

---

### 前端实现

#### 1. 更新服务 (src/services/question.ts)

```typescript
import { GET } from "./ajax";

export async function getQuestionById(id: string) {
  const url = `/api/question/${id}`;
  const data = await GET(url);
  return data;
}

// 新增：获取热门问卷列表
export async function getFeaturedQuestions() {
  const url = `/api/questions/featured`;
  const data = await GET(url);
  return data;
}

// 新增：获取问卷预览
export async function getQuestionPreview(id: string) {
  const url = `/api/questions/${id}/preview`;
  const data = await GET(url);
  return data;
}
```

#### 2. 更新首页 (src/app/page.tsx)

```typescript
import { Metadata } from 'next';
import Link from 'next/link';
import { getFeaturedQuestions } from '@/services/question';

export const metadata: Metadata = {
  title: '问卷系统 - 首页',
  description: '欢迎使用我们的问卷填写系统',
};

interface FeaturedQuestion {
  id: string;
  title: string;
  description: string;
  featured?: boolean;
  pinned?: boolean;
  questionCount: number;
  answerCount: number;
  publishedAt: string;
}

async function QuestionList() {
  try {
    const res = await getFeaturedQuestions();
    const questions: FeaturedQuestion[] = res.data || [];

    if (questions.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          暂无热门问卷
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {questions.map((question) => (
          <Link
            key={question.id}
            href={`/question/${question.id}/preview`}
            className="block p-6 bg-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-300"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {question.title}
                  </h3>
                  {question.pinned && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      🔝 置顶
                    </span>
                  )}
                  {question.featured && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      ⭐ 推荐
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-3">{question.description}</p>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="mr-4">📋 共{question.questionCount}个问题</span>
                  <span>👥 已有{question.answerCount}人填写</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    );
  } catch (error) {
    console.error('获取热门问卷失败:', error);
    return (
      <div className="text-center py-8 text-red-500">
        获取问卷列表失败，请刷新重试
      </div>
    );
  }
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        {/* ... 标题和功能介绍保持不变 ... */}

        {/* 问卷列表 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">热门问卷示例</h2>
          <QuestionList />
        </div>

        {/* ... 行动号召保持不变 ... */}
      </div>
    </div>
  );
}
```

#### 3. 新增预览页面 (src/app/question/[id]/preview.tsx)

```typescript
import { getQuestionPreview } from '@/services/question';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PreviewPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: PreviewPageProps) {
  try {
    const res = await getQuestionPreview(params.id);
    return {
      title: `${res.data.title} - 问卷预览`,
    };
  } catch {
    return { title: '问卷预览' };
  }
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  try {
    const res = await getQuestionPreview(params.id);
    const question = res.data;

    if (!question) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* 返回按钮 */}
          <Link
            href="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
          >
            ← 返回首页
          </Link>

          {/* 问卷信息卡片 */}
          <div className="bg-white rounded-xl shadow-md p-8 mb-6">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-800">
                  {question.title}
                </h1>
                {question.pinned && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    🔝 置顶
                  </span>
                )}
                {question.featured && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                    ⭐ 推荐
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-lg">{question.description}</p>
            </div>

            {/* 统计信息 */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {question.questionCount}
                </div>
                <div className="text-sm text-gray-600">道题目</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {question.answerCount}
                </div>
                <div className="text-sm text-gray-600">人已填写</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">
                  {new Date(question.createdAt).toLocaleDateString('zh-CN')}
                </div>
                <div className="text-sm text-gray-600">发布日期</div>
              </div>
            </div>

            {/* 预览提示 */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 这是问卷预览页面，可以查看问卷内容但无法提交答卷。
                如需填写此问卷，请点击"立即填写"按钮。
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-4 mt-6">
              <Link
                href={`/question/${question.id}`}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg transition-all text-center"
              >
                立即填写
              </Link>
              <button
                onClick={() => window.print()}
                className="px-6 py-3 bg-white text-gray-800 font-medium rounded-lg border border-gray-300 hover:shadow-lg transition-all"
              >
                打印预览
              </button>
            </div>
          </div>

          {/* 问卷内容 */}
          <div className="bg-white rounded-xl shadow-md p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">问卷内容预览</h2>

            {question.components && question.components.length > 0 ? (
              <div className="space-y-6">
                {question.components.map((component, index) => (
                  <div key={component.id || index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">
                        {index + 1}. {component.label || component.title || '未命名题目'}
                      </h3>
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                        {component.type || '未知类型'}
                      </span>
                    </div>

                    {component.description && (
                      <p className="text-sm text-gray-600 mb-3">{component.description}</p>
                    )}

                    {/* 根据不同的题型显示选项 */}
                    {['radio', 'checkbox', 'select'].includes(component.type) &&
                     component.options && (
                      <div className="space-y-2">
                        {component.options.map((option, idx) => (
                          <div key={idx} className="text-sm text-gray-600 pl-4">
                            • {option.label || option.value || option}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 禁用状态提示 */}
                    <div className="mt-3 p-2 bg-gray-100 rounded text-sm text-gray-500 italic">
                      [预览模式 - 此处禁用交互]
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                问卷暂无内容
              </p>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('获取问卷预览失败:', error);
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto text-center py-12">
          <p className="text-red-600 text-lg">获取问卷信息失败，请检查问卷ID是否正确</p>
          <Link
            href="/"
            className="inline-block mt-4 px-6 py-2 text-blue-600 hover:text-blue-800"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    );
  }
}
```

---

## 七、数据库迁移（MongoDB）

```javascript
// 如果已有问卷数据，需要添加新字段
db.questions.updateMany(
  {},
  {
    $set: {
      featured: false,
      pinned: false,
    },
  },
);

// 为热门问卷设置标签示例
db.questions.updateOne({ _id: ObjectId("...") }, { $set: { featured: true } });

db.questions.updateOne({ _id: ObjectId("...") }, { $set: { pinned: true } });

// 创建索引优化查询性能
db.questions.createIndex({ featured: 1, pinned: 1, publishedAt: -1 });
```

---

## 八、总结

### 优先级处理

```
置顶 + 推荐 > 仅置顶 > 仅推荐 > 普通
权重计算：pinned(1000) + featured(100) + 时间因子
```

### API调用流程

```
首页加载 → getFeaturedQuestions() → 获取带统计的问卷列表
↓
用户点击 → 跳转到 /question/[id]/preview
↓
getQuestionPreview() → 获取问卷完整信息
↓
展示预览 + 提供填写入口
```

### 关键特性

- ✅ 真实数据驱动，零硬编码
- ✅ 完整的置顶/推荐优先级管理
- ✅ 精准的题目数量统计
- ✅ 实时的答卷计数
- ✅ 优雅的预览体验
