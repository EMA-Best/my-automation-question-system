# 问卷统计页 AI 分析报告实现方案

## 1. 背景与目标

当前统计页已具备：

- 表格统计（答卷明细）
- 图表统计（单选/多选聚合）

目标是在统计页新增 `AI分析报告` 能力，对已收集答卷进行结构化分析，输出可读、可追溯、可导出的运营报告。

AI 模型使用后端现有 `openai-compatible` 配置（当前可对接 DeepSeek）。

---

## 2. 总体方案

### 2.1 架构思路

- 前端：在统计页右侧 Tabs 增加 `AI分析报告`
- 后端：在 `stat` 模块旁新增 `stat-report` 能力
- AI：复用 `question-server-nestjs/src/ai/ai.service.ts` 的 provider 配置
- 数据：新增报告集合存储快照，避免每次打开页面都重复调用模型

### 2.2 核心原则

- 手动触发生成，避免成本失控
- 报告结构化 JSON 返回，不直接渲染大段纯文本
- 结论必须附数据依据（题目/选项/计数）
- 文本题先脱敏再送模型

---

## 3. 前端实现方案（react-ts-questions）

### 3.1 页面信息架构

在 `src/pages/question/Stat/index.tsx` 中把右侧视图从 2 个扩展为 3 个：

- `table` 表格统计
- `chart` 图表统计
- `ai-report` AI分析报告

### 3.2 UI 模块设计

新增目录建议：

- `src/pages/question/Stat/AIReport/index.tsx`
- `src/pages/question/Stat/AIReport/index.module.scss`
- `src/pages/question/Stat/AIReport/components/AIReportToolbar.tsx`
- `src/pages/question/Stat/AIReport/components/AIReportSummary.tsx`
- `src/pages/question/Stat/AIReport/components/AIReportInsights.tsx`
- `src/pages/question/Stat/AIReport/components/AIReportRisks.tsx`
- `src/pages/question/Stat/AIReport/components/AIReportRecommendations.tsx`
- `src/pages/question/Stat/AIReport/components/AIReportEmpty.tsx`

### 3.3 交互状态

- `idle`：未生成，显示空状态 + 生成按钮
- `generating`：生成中，显示骨架屏/进度文案
- `success`：展示完整报告
- `failed`：错误提示 + 重试按钮

### 3.4 顶部工具栏

- 主按钮：`生成报告`
- 次按钮：`重新生成`
- 次按钮：`导出报告`（二期可先占位）
- 状态标签：未生成/生成中/已完成/失败
- 元信息：样本数、最近生成时间、模型名

### 3.5 报告内容区块

- 执行摘要（headline + brief）
- 关键发现（3-5 条）
- 样本概览（总数、有效样本、时间范围）
- 题目洞察（按题目分组）
- 风险提示（偏差、样本不足、异常）
- 行动建议（可执行建议）

---

## 4. 前端接口设计

在 `src/services/stat.ts` 新增：

- `getQuestionAIReportLatestService(questionId)`
- `generateQuestionAIReportService(questionId, payload)`
- `regenerateQuestionAIReportService(questionId, payload)`

请求路径建议：

- `GET /api/stat/:questionId/ai-report/latest`
- `POST /api/stat/:questionId/ai-report/generate`
- `POST /api/stat/:questionId/ai-report/regenerate`

请求参数建议：

```ts
export type GenerateAIReportPayload = {
  mode?: 'quick' | 'standard' | 'deep';
  timeRange?: 'all' | '7d' | '30d';
  includeTextAnswers?: boolean;
  maxAnswers?: number;
};
```

---

## 5. 后端实现方案（question-server-nestjs）

### 5.1 模块拆分建议

新增 `stat-report` 模块，避免把 AI 报告逻辑塞进现有 `stat.service.ts`：

- `src/stat-report/stat-report.module.ts`
- `src/stat-report/stat-report.controller.ts`
- `src/stat-report/stat-report.service.ts`
- `src/stat-report/schemas/ai-report.schema.ts`
- `src/stat-report/dto/generate-ai-report.dto.ts`

### 5.2 依赖注入

`StatReportService` 建议注入：

- `QuestionModel`
- `AnswerModel`
- `AIService`
- 可选：`StatService`（复用部分统计能力）

### 5.3 生成链路

1. 校验问卷存在、发布状态、权限
2. 读取问卷结构（componentList）
3. 按条件拉取答卷
4. 进行数据聚合与脱敏
5. 构建分析 prompt（结构化输入）
6. 调用 DeepSeek（通过 AIService provider）
7. 校验模型输出 JSON Schema
8. 存储报告快照
9. 返回最新报告

---

## 6. 数据模型设计

集合建议：`ai_analysis_reports`

```ts
{
  _id: ObjectId,
  questionId: string,
  questionTitle: string,
  status: 'pending' | 'processing' | 'succeeded' | 'failed',

  answerCount: number,
  validAnswerCount: number,
  filters: {
    mode: 'quick' | 'standard' | 'deep',
    timeRange: 'all' | '7d' | '30d',
    includeTextAnswers: boolean,
    maxAnswers: number,
  },

  report: {
    summary: {
      headline: string,
      brief: string,
    },
    highlights: Array<{
      title: string,
      detail: string,
      evidenceQuestionIds: string[],
    }>,
    sampleOverview: {
      totalAnswers: number,
      validAnswers: number,
      textCoverage: number,
    },
    questionInsights: Array<{
      questionId: string,
      questionTitle: string,
      questionType: string,
      finding: string,
      evidence: string,
      chartHint?: string,
    }>,
    risks: string[],
    recommendations: string[],
    confidenceNotes: string[],
  },

  modelInfo: {
    provider: string,
    model: string,
    temperature: number,
    generatedAt: Date,
  },

  errorMessage?: string,
  createdBy: string,
  createdAt: Date,
  updatedAt: Date,
}
```

索引建议：

- `{ questionId: 1, createdAt: -1 }`
- `{ questionId: 1, status: 1, createdAt: -1 }`

---

## 7. Prompt 设计（DeepSeek）

### 7.1 输入内容

- 问卷基础信息（标题、题目列表）
- 客观题统计（选项计数、占比）
- 文本题摘要样本（已脱敏，限量）
- 样本规模与时间范围

### 7.2 输出约束

- 必须返回 JSON，不要 Markdown
- 结论仅基于输入数据，不得臆测
- 每条关键发现必须带 evidence
- 若样本不足，必须输出风险提示

### 7.3 后端容错

- JSON 解析失败：记录 failed 并返回可读错误
- 字段缺失：后端兜底补空数组/空字符串
- 长文本截断：防止 token 失控

---

## 8. 安全与合规

- 权限：仅问卷作者/管理员可生成与查看报告
- 脱敏：手机号、邮箱、身份证、昵称等模式脱敏
- 最小暴露：前端不返回原始整份答卷
- 日志：记录生成请求与耗时，不记录敏感正文

---

## 9. 性能与成本控制

- 默认最多分析最近 `300~500` 份答卷
- 文本题每题最多抽样 `20~50` 条
- 同参数短时间内命中缓存（返回最近成功报告）
- 串行任务改异步队列（二期）

---

## 10. 分阶段落地计划

### Phase 1（本期）

- 前端新增 AI报告 Tab
- 后端新增 generate/latest 两个接口
- 结构化报告展示
- 支持手动生成与重试

### Phase 2

- 报告历史版本
- 导出 PDF
- 更多筛选（时间范围、样本范围）

### Phase 3

- 定时自动报告
- 多问卷横向对比
- 管理端总览看板

---

## 11. 验收标准（建议）

- 能在统计页一键生成报告
- 报告包含摘要、洞察、风险、建议四大块
- 报告可追溯到题目依据
- 失败可重试，错误信息可读
- 不泄露敏感答卷原文

---

## 12. 与现有代码的改动点清单

### 前端

- `src/pages/question/Stat/index.tsx`：增加 `ai-report` tab
- `src/pages/question/Stat/AIReport/*`：新增组件
- `src/services/stat.ts`：新增 AI 报告接口
- 可选：`src/types/stat.ts`：新增报告类型定义

### 后端

- `src/stat-report/*`：新增模块
- `src/app.module.ts`：注册新模块
- `src/ai/ai.service.ts`：复用，无需改 provider 基础能力
- 可选：`src/stat/stat.service.ts`：抽取公共聚合函数供复用

---

## 13. 风险与应对

- 风险：模型输出格式不稳定
  - 应对：强 schema 校验 + 兜底
- 风险：样本太大导致超时
  - 应对：采样、截断、分层总结
- 风险：内容“看起来合理但无依据”
  - 应对：每条结论强制 evidence 字段

---

## 14. 下一步建议

1. 先完成后端 `generate/latest` MVP。
2. 前端接入 AI 报告 Tab 与状态机。
3. 联调 DeepSeek 输出 JSON 稳定性。
4. 完成首版验收后再做导出与历史版本。
