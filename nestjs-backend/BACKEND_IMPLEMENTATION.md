# NestJS 后端实现指南

## 一、数据库Schema更新

### 1. 更新MongoDB中的Questions文档结构

```typescript
// src/schemas/question.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Question extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ type: Array, default: [] })
  components: any[];

  @Prop({ default: false })
  featured: boolean; // 推荐标志

  @Prop({ default: false })
  pinned: boolean; // 置顶标志

  @Prop({ type: Date })
  publishedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ enum: ['draft', 'published'], default: 'draft' })
  status: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
```

### 2. MongoDB迁移脚本

```javascript
// 添加新字段到现有文档
db.questions.updateMany(
  {},
  {
    $set: {
      featured: false,
      pinned: false,
    },
  },
);

// 创建索引以提高查询性能
db.questions.createIndex({ featured: 1, pinned: 1, publishedAt: -1 });
```

---

## 二、Service层实现

### 完整的QuestionService实现

```typescript
// src/modules/question/question.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Question } from './schemas/question.schema';
import { Answer } from './schemas/answer.schema';

@Injectable()
export class QuestionService {
  constructor(
    @InjectModel('Question') private questionModel: Model<Question>,
    @InjectModel('Answer') private answerModel: Model<Answer>,
  ) {}

  /**
   * 获取推荐问卷列表（带排序和统计）
   * 包括置顶、推荐的问卷，按优先级排序
   */
  async getFeaturedQuestions() {
    const questions = await this.questionModel
      .find({
        $or: [{ featured: true }, { pinned: true }],
        status: 'published',
      })
      .exec();

    // 构建包含统计信息的响应
    const result = await Promise.all(
      questions.map(async (q) => ({
        id: q._id.toString(),
        title: q.title,
        description: q.description,
        featured: q.featured,
        pinned: q.pinned,
        questionCount: this.countQuestions(q.components),
        answerCount: await this.countAnswers(q._id.toString()),
        publishedAt: q.publishedAt || q.createdAt,
      })),
    );

    // 按优先级排序
    return result.sort((a, b) => {
      // 计算优先级权重
      const priorityA = (a.pinned ? 1000 : 0) + (a.featured ? 100 : 0);
      const priorityB = (b.pinned ? 1000 : 0) + (b.featured ? 100 : 0);

      // 优先级相同时，按发布时间排序（较新的在前）
      if (priorityA === priorityB) {
        return (
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        );
      }

      return priorityB - priorityA;
    });
  }

  /**
   * 获取问卷预览信息
   * 用于首页展示预览
   */
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

  /**
   * 获取完整问卷（编辑/填写）
   */
  async getQuestion(questionId: string) {
    const question = await this.questionModel.findById(questionId).exec();

    if (!question) {
      throw new NotFoundException(`问卷 ${questionId} 不存在`);
    }

    return question;
  }

  /**
   * 计算非填写类题目数量
   * 排除的类型：input, textarea, number等单纯用于数据输入的类型
   */
  private countQuestions(components: any[]): number {
    if (!Array.isArray(components)) return 0;

    const writeOnlyTypes = [
      'input',
      'textarea',
      'number',
      'email',
      'url',
      'date',
    ];
    return components.filter((c) => !writeOnlyTypes.includes(c.type)).length;
  }

  /**
   * 计算答卷数
   */
  private async countAnswers(questionId: string): Promise<number> {
    return await this.answerModel.countDocuments({ questionId }).exec();
  }

  /**
   * 设置问卷为推荐
   */
  async setFeatured(questionId: string, featured: boolean) {
    return await this.questionModel
      .findByIdAndUpdate(questionId, { featured }, { new: true })
      .exec();
  }

  /**
   * 设置问卷为置顶
   */
  async setPinned(questionId: string, pinned: boolean) {
    return await this.questionModel
      .findByIdAndUpdate(questionId, { pinned }, { new: true })
      .exec();
  }

  /**
   * 发布问卷
   */
  async publishQuestion(questionId: string) {
    return await this.questionModel
      .findByIdAndUpdate(
        questionId,
        {
          status: 'published',
          publishedAt: new Date(),
        },
        { new: true },
      )
      .exec();
  }
}
```

---

## 三、Controller层实现

### 完整的QuestionController实现

```typescript
// src/modules/question/question.controller.ts
import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('api/questions')
export class QuestionController {
  constructor(private questionService: QuestionService) {}

  /**
   * 获取热门问卷列表（公开）
   * GET /api/questions/featured
   */
  @Get('featured')
  async getFeaturedQuestions() {
    const data = await this.questionService.getFeaturedQuestions();
    return {
      code: 200,
      data,
      message: 'success',
    };
  }

  /**
   * 获取问卷预览（公开）
   * GET /api/questions/:id/preview
   */
  @Get(':id/preview')
  async getQuestionPreview(@Param('id') id: string) {
    const data = await this.questionService.getQuestionPreview(id);
    return {
      code: 200,
      data,
      message: 'success',
    };
  }

  /**
   * 获取完整问卷（用于填写）
   * GET /api/questions/:id
   */
  @Get(':id')
  async getQuestion(@Param('id') id: string) {
    const data = await this.questionService.getQuestion(id);
    return {
      code: 200,
      data,
      message: 'success',
    };
  }

  /**
   * 管理员：设置问卷为推荐
   * PATCH /api/questions/:id/admin/featured
   * Body: { featured: true/false }
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/admin/featured')
  @HttpCode(200)
  async setFeatured(
    @Param('id') id: string,
    @Body('featured') featured: boolean,
  ) {
    const data = await this.questionService.setFeatured(id, featured);
    return {
      code: 200,
      data,
      message: featured ? '设置推荐成功' : '取消推荐成功',
    };
  }

  /**
   * 管理员：设置问卷为置顶
   * PATCH /api/questions/:id/admin/pinned
   * Body: { pinned: true/false }
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/admin/pinned')
  @HttpCode(200)
  async setPinned(@Param('id') id: string, @Body('pinned') pinned: boolean) {
    const data = await this.questionService.setPinned(id, pinned);
    return {
      code: 200,
      data,
      message: pinned ? '设置置顶成功' : '取消置顶成功',
    };
  }

  /**
   * 管理员：发布问卷
   * PATCH /api/questions/:id/admin/publish
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/admin/publish')
  @HttpCode(200)
  async publishQuestion(@Param('id') id: string) {
    const data = await this.questionService.publishQuestion(id);
    return {
      code: 200,
      data,
      message: '发布成功',
    };
  }
}
```

---

## 四、模块配置

### Question Module

```typescript
// src/modules/question/question.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';
import { QuestionSchema } from './schemas/question.schema';
import { AnswerSchema } from './schemas/answer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Question', schema: QuestionSchema },
      { name: 'Answer', schema: AnswerSchema },
    ]),
  ],
  controllers: [QuestionController],
  providers: [QuestionService],
  exports: [QuestionService],
})
export class QuestionModule {}
```

---

## 五、数据示例

### 示例问卷数据

```javascript
// MongoDB中的示例文档
{
  "_id": ObjectId("65a1b2c3d4e5f6g7h8i9j0k1"),
  "title": "年轻人动漫偏好调查",
  "description": "了解年轻人对不同类型动漫的偏好和观看习惯",
  "components": [
    {
      "id": "comp_1",
      "type": "radio",
      "label": "您最喜欢的动漫类型是什么？",
      "options": [
        { "label": "热血战斗", "value": "action" },
        { "label": "恋爱向", "value": "romance" },
        { "label": "悬疑推理", "value": "mystery" },
        { "label": "日常搞笑", "value": "comedy" }
      ]
    },
    {
      "id": "comp_2",
      "type": "checkbox",
      "label": "您曾观看过以下哪些经典动漫？（可多选）",
      "options": [
        { "label": "进击的巨人", "value": "aot" },
        { "label": "死神", "value": "bleach" },
        { "label": "火影忍者", "value": "naruto" },
        { "label": "海贼王", "value": "onepiece" }
      ]
    },
    {
      "id": "comp_3",
      "type": "textarea",
      "label": "请分享您对动漫的看法"
    }
  ],
  "featured": true,
  "pinned": false,
  "status": "published",
  "publishedAt": ISODate("2024-01-15T10:00:00Z"),
  "createdAt": ISODate("2024-01-15T10:00:00Z"),
  "updatedAt": ISODate("2024-01-15T10:00:00Z"),
  "createdBy": ObjectId("65a1b2c3d4e5f6g7h8i9j0k2")
}

{
  "_id": ObjectId("65a1b2c3d4e5f6g7h8i9j0k3"),
  "title": "产品满意度调查",
  "description": "收集用户对我们产品的使用体验和建议",
  "components": [...],
  "featured": false,
  "pinned": true,  // 这个问卷置顶了
  "status": "published",
  "publishedAt": ISODate("2024-01-10T08:00:00Z"),
  "createdAt": ISODate("2024-01-10T08:00:00Z"),
  "updatedAt": ISODate("2024-01-10T08:00:00Z")
}
```

---

## 六、优先级排序规则

```typescript
/**
 * 排序优先级权重计算
 *
 * pinned (置顶): 1000 points
 * featured (推荐): 100 points
 *
 * 组合情况：
 * - 置顶 + 推荐 = 1100 points (最优先)
 * - 仅置顶 = 1000 points
 * - 仅推荐 = 100 points
 * - 普通 = 0 points (不会出现在列表中)
 *
 * 相同优先级下，按发布时间降序排列（最新的在前）
 */

// 优先级排序示例
const questions = [
  { id: '1', pinned: true, featured: true, publishedAt: '2024-01-15' }, // 权重: 1100
  { id: '2', pinned: true, featured: false, publishedAt: '2024-01-14' }, // 权重: 1000
  { id: '3', pinned: false, featured: true, publishedAt: '2024-01-13' }, // 权重: 100
  { id: '4', pinned: false, featured: true, publishedAt: '2024-01-12' }, // 权重: 100
];

// 排序后的结果顺序：1 -> 2 -> 3 -> 4
```

---

## 七、API测试示例

### 使用curl测试

```bash
# 获取热门问卷列表
curl -X GET http://localhost:3005/api/questions/featured

# 获取问卷预览
curl -X GET http://localhost:3005/api/questions/65a1b2c3d4e5f6g7h8i9j0k1/preview

# 获取完整问卷（需要验证）
curl -X GET http://localhost:3005/api/questions/65a1b2c3d4e5f6g7h8i9j0k1

# 管理员：设置推荐
curl -X PATCH http://localhost:3005/api/questions/65a1b2c3d4e5f6g7h8i9j0k1/admin/featured \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"featured": true}'

# 管理员：设置置顶
curl -X PATCH http://localhost:3005/api/questions/65a1b2c3d4e5f6g7h8i9j0k1/admin/pinned \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{"pinned": true}'

# 管理员：发布问卷
curl -X PATCH http://localhost:3005/api/questions/65a1b2c3d4e5f6g7h8i9j0k1/admin/publish \
  -H "Authorization: Bearer {token}"
```

### 响应示例

```json
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
    },
    {
      "id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "title": "产品满意度调查",
      "description": "收集用户对我们产品的使用体验和建议",
      "featured": false,
      "pinned": true,
      "questionCount": 8,
      "answerCount": 312,
      "publishedAt": "2024-01-10T08:00:00Z"
    }
  ]
}
```

---

## 九、当前项目真实返回示例（重要）

> 本仓库在 [src/transform/transform.interceptor.ts](src/transform/transform.interceptor.ts) 使用了全局响应包装：
> 所有成功响应统一为 `{ "errno": 0, "data": ... }`。
>
> 同时，本项目问卷字段名为 `desc`（不是 description），题目列表字段为 `componentList`（不是 components）。

### 1) GET /api/questions/featured

成功响应示例：

```json
{
  "errno": 0,
  "data": [
    {
      "id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "title": "年轻人动漫偏好调查",
      "desc": "了解年轻人对不同类型动漫的偏好和观看习惯",
      "featured": true,
      "pinned": false,
      "pinnedAt": null,
      "questionCount": 10,
      "answerCount": 523
    },
    {
      "id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "title": "产品满意度调查",
      "desc": "收集用户对我们产品的使用体验和建议",
      "featured": false,
      "pinned": true,
      "pinnedAt": "2026-02-01T08:00:00.000Z",
      "questionCount": 8,
      "answerCount": 312
    }
  ]
}
```

### 2) GET /api/questions/:id/preview

成功响应示例：

```json
{
  "errno": 0,
  "data": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "title": "年轻人动漫偏好调查",
    "desc": "了解年轻人对不同类型动漫的偏好和观看习惯",
    "featured": true,
    "pinned": false,
    "pinnedAt": null,
    "questionCount": 10,
    "answerCount": 523,
    "componentList": [
      {
        "fe_id": "x1y2z3",
        "type": "questionInfo",
        "title": "问卷信息",
        "isHidden": false,
        "isLocked": false,
        "props": { "title": "年轻人动漫偏好调查", "desc": "..." }
      },
      {
        "fe_id": "a1b2c3",
        "type": "questionRadio",
        "title": "你更喜欢哪种类型？",
        "isHidden": false,
        "isLocked": false,
        "props": {
          "title": "你更喜欢哪种类型？",
          "options": [
            { "text": "热血", "value": "1" },
            { "text": "恋爱", "value": "2" }
          ]
        }
      }
    ]
  }
}
```

---

## 八、关键实现要点

### ✅ 完成清单

- [x] 数据库Schema支持featured和pinned字段
- [x] 题目数量统计（排除填写类）
- [x] 答卷数量统计
- [x] 优先级排序（置顶>推荐>普通）
- [x] 预览功能（不可编辑）
- [x] 管理员设置接口
- [x] 完整的错误处理
- [x] 性能优化索引

### 🔒 安全考虑

- 使用JWT认证和管理员验证保护管理接口
- 预览接口不返回敏感的编辑信息
- 支持草稿和发布状态隔离

### 🚀 性能优化

- 为featured、pinned、publishedAt字段创建复合索引
- 使用异步加载答卷统计数据
- 考虑添加缓存层（Redis）存储热门问卷数据
