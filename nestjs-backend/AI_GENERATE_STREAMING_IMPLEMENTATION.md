# AI 生成问卷「ChatGPT 风格 UI + 流式输出 + 结构化预览」实现文档

适用范围：本仓库前端（React 19 + TS strict + AntD 5 + RTK + ahooks + dnd-kit + redux-undo）与对应 NestJS 后端（Deepseek 模型接入）。

> 目标：
>
> 1. AI 生成弹窗改造成 ChatGPT 风格（对话区 + 输入区 + 流式输出）。
> 2. 前端不再等待一次性响应，改为「边生成边展示」。
> 3. 预览区域展示“真实问卷结构”（渲染组件），而不是纯文本列表。

---

## 0. 现状与问题定位

- 当前入口：src/pages/question/Edit/EditHeader/EditAIGenerateButton/AIGenerateModal.tsx
- 当前请求：src/services/question.ts 的 aiGenerateQuestionService() -> POST /api/question/ai-generate
- 当前体验：必须等待后端完整返回 JSON 才能展示；预览仅展示标题/描述/组件清单文字。

---

## 1. 交互与 UI 目标（ChatGPT 风格）

### 1.1 弹窗布局（推荐：左右分栏）

- Modal 标题：AI 生成问卷
- 左侧：对话流（Chat）
  - 消息气泡：用户/助手两种样式
  - 助手消息支持流式追加（逐字/逐段落）
  - 生成中显示“正在生成…”指示器 + 可停止按钮
- 右侧：结构化预览（Preview）
  - 直接渲染问卷组件（QuestionTitle/QuestionInput/...）
  - 支持实时刷新：当流式到达 pageInfo / component 时立即更新预览

移动端/窄屏：左右分栏改为 Tabs（对话 / 预览）。

### 1.2 核心按钮与状态

- 发送/生成：触发一次生成会话
- 停止生成：Abort 当前请求（AbortController）
- 重新生成：清空会话/预览后重新请求
- 确认应用：把已生成的 pageInfo + componentList 写入 Redux（resetComponents + resetPageInfo + clearHistory）

### 1.3 UI 细节建议（保持 AntD，不引入新样式体系）

- 使用 AntD：Modal + Card + Typography + Avatar + Button + Space
- 样式：新增 \*.module.scss + classnames
- 关键视觉：
  - 对话区域背景浅灰，气泡圆角
  - 用户气泡靠右（主色），助手气泡靠左（白底）
  - 预览区域像“手机问卷”容器（白底、内边距、阴影）

---

## 2. 数据协议：为了“流式 + 结构化预览”需要怎样的返回

### 2.1 为什么不能只流式文本

如果仅仅流式输出自然语言文本，前端很难在生成过程中构建 componentList 并实时渲染预览。

因此建议后端流式返回“结构化事件”，每个事件可独立解析、校验并更新预览。

### 2.2 推荐协议：SSE（text/event-stream）+ JSON 事件

后端以 SSE 输出事件，前端边读边解析：

- event: meta
  - data: { requestId, model, startedAt }

- event: assistant_delta
  - data: { textDelta: "..." }
  - 用于 ChatGPT 风格逐字展示

- event: page_info
  - data: { title, desc, js, css, isPublished }

- event: component
  - data: { fe_id?, type, title?, props, isHidden?, isLocked? }

- event: done
  - data: { ok: true }

- event: error
  - data: { message, code? }

> 说明：
>
> - assistant_delta 用于“看起来像 ChatGPT”；page_info/component 用于“可渲染预览”。
> - component 事件可以多次发送；前端收到后 append 进 componentList。
> - fe_id 可以由后端给；也允许前端收到后补齐（nanoid）。

### 2.3 最终落地数据结构（与前端现有 normalize 对齐）

前端最终需要：

- pageInfo: PageInfoType
- componentList: ComponentInfoType[]

并沿用当前的 sanitize/normalize 逻辑（尤其是组件 type 必须在 src/components/QuestionComponents/index.ts 中存在）。

---

## 3. 前端改造方案（React 工程）

### 3.1 改造范围（建议拆分）

1. 现有弹窗重构（UI + 状态机）

- src/pages/question/Edit/EditHeader/EditAIGenerateButton/AIGenerateModal.tsx

2. 新增：SSE 读取与解析（不要用 axios；浏览器 axios 不支持流式读取响应体）

- 新增：src/services/aiGenerateStream.ts（或放在 src/services/question.ts 中新增 stream 版本，但实现用 fetch）
- 新增：src/hooks/useAIGenerateStream.ts

3. 新增：问卷结构预览组件（复用 getComponentConfigByType 的渲染方式）

- 新增：src/pages/question/Edit/EditHeader/EditAIGenerateButton/AIGeneratePreview.tsx

> 可选：做成通用组件，未来也能用于“导入 JSON 预览”。

### 3.2 前端消息与预览状态设计（强类型）

推荐类型（示意）：

- ChatMessage
  - id: string
  - role: 'user' | 'assistant'
  - content: string

- AIGenerateDraft
  - pageInfo: PageInfoType
  - componentList: ComponentInfoType[]

- AIGenerateStreamEvent（判别联合）
  - { type: 'assistant_delta'; textDelta: string }
  - { type: 'page_info'; pageInfo: PageInfoType }
  - { type: 'component'; component: ComponentInfoType }
  - { type: 'done' }
  - { type: 'error'; message: string }

### 3.3 流式请求：fetch + ReadableStream（推荐）

原因：

- axios 在浏览器侧无法像 Node 一样逐 chunk 读流
- EventSource 仅支持 GET，不适合把 prompt 放 body（除非你愿意改成 query 或先创建任务再订阅）

实现方式：

- POST /api/question/ai-generate/stream
- 使用 AbortController 支持“停止生成”
- 用 TextDecoder 逐 chunk 解码
- 解析 SSE 帧（按 \n\n 分隔事件；提取 event/data 字段）

### 3.4 预览渲染：直接渲染真实问卷组件

做法：

- 复用编辑画布的渲染逻辑：getComponentConfigByType(type) -> Component
- 过滤 isHidden
- 不需要 sortable / 选中态；仅作为预览

目标效果：右侧预览区域看起来就像真实问卷页面（标题、输入框、单选、多选、文本域等）。

### 3.5 与现有 Redux 接入（应用生成结果）

保持当前行为：

- dispatch(resetComponents({ componentList, selectedId }))
- dispatch(ActionCreators.clearHistory())
- dispatch(resetPageInfo(pageInfo))

差异点：

- componentList 在流式过程中逐步增长；“确认应用”只有在 done 后或校验通过后才启用。

### 3.6 校验与容错（非常关键）

沿用/增强现有 AIGenerateModal.tsx 的：

- sanitizeComponentList()
- normalizeAIGenerateData()

并扩展到“单个 component 事件”的校验：

- type 必须在 getComponentConfigByType() 找到
- fe_id 为空/重复则前端补齐 nanoid
- props 不是对象则置为 {}

---

## 4. 后端改造方案（NestJS 工程，Deepseek 流式）

> 注意：当前仓库只包含前端；这里给出后端实现指导与关键代码结构。你把这些改动应用到 NestJS 后端仓库即可。

### 4.1 新增接口

- POST /api/question/ai-generate/stream
  - Body: { prompt: string }
  - Response: text/event-stream

保留原有非流式接口（兼容旧逻辑/兜底）：

- POST /api/question/ai-generate

### 4.2 Controller：SSE 输出

关键点：

- 设置 Header：
  - Content-Type: text/event-stream; charset=utf-8
  - Cache-Control: no-cache, no-transform
  - Connection: keep-alive
- 立即 flushHeaders
- 按 SSE 格式写入：
  - res.write(`event: xxx\n`)
  - res.write(`data: ${JSON.stringify(payload)}\n\n`)

并实现：

- 心跳 ping（每 10~20s）防止代理断开：event: ping
- 请求取消：监听 req.on('close') / abort signal

### 4.3 Service：Deepseek 侧开启 stream

大多数 Deepseek / OpenAI 兼容 SDK 都是：

- stream: true
- 返回 chunk（delta 内容）

后端需要把模型“生成的 token 流”转换为“可解析的结构化事件”。推荐两种策略：

#### 策略 A（推荐）：让模型输出 JSON Lines（每行一个 JSON 事件）

Prompt 约束模型输出如下格式（严格）：

- 第一行：{"type":"page_info","data":{...}}
- 后续每行：{"type":"component","data":{...}}
- 随时允许：{"type":"assistant_delta","data":{"textDelta":"..."}}
- 最后一行：{"type":"done","data":{}}

后端做法：

- 累积模型的 delta 文本到 buffer
- 当 buffer 出现换行时，按行切分，逐行 JSON.parse
- 解析成功就转发为 SSE event
- 解析失败的残缺行继续留在 buffer 等下一批 token 补齐

优点：

- 前端能很快拿到可渲染的 component
- 不需要在前端做复杂“从自然语言抽 JSON”的工作

#### 策略 B：模型只输出 JSON（单个大 JSON），后端流式转发

- 模型只输出一个完整 JSON
- 后端把 token 直接当 assistant_delta 转发
- done 后再 JSON.parse 一次性产出 page_info/component

缺点：预览仍然会等到最后才能渲染组件（不满足“边生成边预览”）。

### 4.4 后端校验与安全

- 白名单：允许的组件 type 只能来自前端注册表（questionTitle/questionInput/...）对应的后端常量
- 限制组件数量（例如 <= 50）
- 限制文本长度（title/desc/option 文本等）
- 禁止输出危险字段（如果项目支持 js/css，请默认置空或 require 额外开关）

---

## 5. Deepseek Prompt 设计建议（让输出稳定且可渲染）

### 5.1 系统提示（示意）

- 你是问卷生成器
- 你只能使用以下组件类型：
  - questionInfo
  - questionTitle
  - questionParagraph
  - questionInput
  - questionTextarea
  - questionRadio
  - questionCheckbox
- props 必须符合组件需要的字段（尽量复用 defaultProps 的字段名）
- 输出必须为 JSON Lines，每行一个 JSON 对象，不要输出 markdown，不要输出多余解释

### 5.2 示例用户 Prompt

用户：帮我生成一份中国人各地区饮食偏好调查问卷

模型应输出：

- page_info（title/desc）
- component（标题、说明、地区输入、单选、多选、文本域、感谢）

---

## 6. 前端预览“更像真实问卷”的落地清单

### 6.1 预览容器

- 模拟问卷页面：白底 Card / div，固定宽度（例如 420~520px），居中
- 组件间距与 EditCanvas 保持一致（或复用其 SCSS）

### 6.2 渲染规则

- 过滤 isHidden
- 对未知 type：不渲染（并在 Chat 区提示“忽略不支持组件”）

### 6.3 与“确认应用”的一致性

预览渲染使用的组件注册表必须与编辑画布一致（getComponentConfigByType），避免“预览能看但应用后报错”。

---

## 7. 实施步骤（建议按里程碑）

### Milestone 1：前端 UI Chat 化（仍用非流式接口）

- 重构弹窗布局为「对话 + 预览」
- 用户发起生成 -> 展示等待/打字指示器
- 收到完整 JSON -> 渲染预览

### Milestone 2：后端新增 SSE 流式接口

- 新增 /ai-generate/stream
- 先实现 assistant_delta 的 token 流（只做“逐字输出”）

### Milestone 3：结构化事件（page_info/component）

- 改 prompt 输出 JSON Lines
- 后端解析 line -> SSE event
- 前端收到 component 事件立即更新预览

### Milestone 4：鲁棒性与体验打磨

- 停止生成（Abort）
- 心跳与超时
- 错误事件展示
- 限流与安全校验

---

## 8. 测试与验收

### 8.1 前端

- npm run lint
- 手测：
  - 输入 prompt -> 立即出现助手气泡并开始流式增长
  - 预览区域随着 component 事件逐步出现真实组件
  - 点击“停止生成”立即停止增长
  - done 后“确认应用”可用，应用后编辑画布与预览一致

### 8.2 后端

- curl 验证 SSE：
  - 请求后立即返回 event 流
  - 断开连接后服务端能停止生成

---

## 9. 与当前代码的对照（方便落地）

- 现有弹窗：src/pages/question/Edit/EditHeader/EditAIGenerateButton/AIGenerateModal.tsx
- 现有服务：src/services/question.ts（aiGenerateQuestionService）
- 可复用渲染逻辑：src/pages/question/Edit/EditCanvas/index.tsx 的 getComponent()（预览可抽成独立组件）
- 组件注册表：src/components/QuestionComponents/index.ts

---

## 10. 风险点与建议

- 代理层（Nginx/网关）可能会缓存/缓冲 SSE：需要关闭缓冲（proxy_buffering off）并拉长超时。
- 大模型输出不稳定：必须用严格协议（JSON Lines）+ 后端兜底校验。
- 不建议让 AI 输出可执行 js/css：如业务必须支持，建议增加开关并做安全审核。
