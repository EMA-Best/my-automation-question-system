# 问卷系统管理员权限（RBAC）端到端实现流程

适用范围：React 19 + TS strict + Ant Design 5（前端） / NestJS（后端） / MongoDB（数据库）

> 目标：在现有“问卷管理（全部/星标/回收站）+ 编辑/发布 + 统计”的主流程上，引入“普通用户 vs 管理员”的权限区分，并新增管理员能力：
>
> - 查看所有用户问卷（全量列表、筛选、批量操作）
> - 用户管理（列表、禁用/启用、重置密码、角色调整）
> - 问卷审核（审核队列、通过/驳回、审核记录）
> - 问卷置顶/推荐（置顶、推荐位、强制下架等运营能力）

---

## 1. 权限模型设计（RBAC + 权限点）

### 1.1 角色（Role）

建议最小可用版本只保留：

- `user`：普通用户
- `admin`：管理员（拥有管理员后台全部能力）

本方案按你的选择：**不做细分角色**，仅 `admin`。

### 1.2 权限点（Permission）

将“能做什么”抽象为权限点，避免前端/后端散落 `role === 'admin'` 判断。

建议权限点（可按需裁剪）：

- 用户域：
  - `user:read` 查看用户列表
  - `user:update` 修改用户（禁用、改角色）
  - `user:resetPassword` 重置密码
- 问卷域：
  - `question:read:any` 查看所有问卷
  - `question:update:any` 修改任意问卷状态（强制下架/恢复）
  - `question:feature` 置顶/推荐
- 审核域：
  - `review:read` 查看审核队列
  - `review:approve` 通过
  - `review:reject` 驳回
- 后台入口：
  - `manage:admin` 访问后台路由

**角色映射**（最小版本）：

- `user`：无上述权限点（仅能管理自己问卷）
- `admin`：包含全部权限点

### 1.3 数据层强制校验原则

- **后端必须校验**：所有管理员接口必须通过 `JWT + Guard` 校验权限点。
- **前端只做“体验优化”**：路由守卫、菜单隐藏、按钮禁用。

---

## 2. 前端页面设计（延用现有管理结构，做美化改造）

### 2.1 路由与布局建议

保持你当前结构：

- `/manage/*` 仍是普通用户的问卷管理区
- 新增 `/manage/admin/*` 作为管理员后台（也可独立 `/admin/*`，但复用现有布局更省改动）

建议路由：

- `/manage/admin`：管理员 Dashboard（概览）
- `/manage/admin/questions`：全量问卷管理
- `/manage/admin/reviews`：审核队列
- `/manage/admin/users`：用户管理
- `/403`：无权限页面

权限守卫：

- 未登录：跳登录
- 已登录但无 `manage:admin`：跳 `/403`

### 2.2 UI 结构（好看、清晰、可扩展）

建议仍采用“两栏布局”，但把左侧从 `Button + Space` 升级为 AntD `Menu`（更像后台系统）。

**页面骨架（管理员后台）**：

- 顶部：沿用现有 Header（Logo + 用户信息），用户信息处展示 Role Tag
- 左侧：Menu（Dashboard / 问卷管理 / 审核队列 / 用户管理）
- 右侧：内容区（Table + Filter Form + Drawer/Modal）

**视觉建议（无需引入新样式体系）**：

- 列表页头：左侧标题 + 右侧操作（刷新、导出、批量操作）
- 使用 `Card` 包裹筛选区和表格，提升层次
- 状态类使用 `Tag`（例如：`Draft`/`PendingReview`/`Approved`/`Rejected`/`Published`）
- 重要待办使用 `Badge`（例如“待审核 12”）
- 操作尽量放在 Table 的“操作列”，二次确认用 `Popconfirm`

### 2.3 管理员 Dashboard（/manage/admin）

目的：让管理员一进来知道“今天要处理什么”。

建议模块：

- 指标卡片（`Statistic`/`Card`）：
  - 待审核数（点击跳转审核队列）
  - 今日新增问卷数
  - 今日新增用户数
  - 已发布问卷总数
- 最近审核记录（最近 10 条）

### 2.4 全量问卷管理（/manage/admin/questions）

**筛选条件（Form）**：

- 关键词（title / id / owner nickname）
- 创建时间范围
- 发布状态（Published/Unpublished）
- 审核状态（Draft/Pending/Approved/Rejected）
- 置顶/推荐（Pinned/Featured）

**表格列（Table）**：

- 标题 / ID（可复制）
- 所属用户（昵称/username）
- 状态：发布状态 + 审核状态（Tag 组合）
- 数据：答卷数、创建时间
- 运营：置顶/推荐（Tag/开关）
- 操作：
  - 查看详情（Drawer：展示问卷信息、组件概要、最近操作日志）
  - 强制下架/恢复（Popconfirm）
  - 置顶/取消置顶、推荐/取消推荐

> 注意：前端置顶/推荐建议走单独接口（只改运营字段），减少误操作影响。

### 2.5 审核队列（/manage/admin/reviews）

**审核流建议**：

- 普通用户编辑完成后：点击“提交审核”
- 审核队列只显示 `PendingReview`

**审核列表列建议**：

- 问卷标题
- 提交人
- 提交时间
- 当前版本号（可选）
- 操作：
  - 预览（跳转只读预览页，或 Drawer 内预览）
  - 通过（可选：自动发布/仅标记通过）
  - 驳回（必须填写原因）

**驳回原因与沟通**：

- 驳回时保存 `reason`，普通用户在自己的问卷管理里可看到“驳回原因”。

### 2.6 用户管理（/manage/admin/users）

**筛选**：

- username / nickname
- 角色（user/admin）
- 状态（active/disabled）

**列表列**：

- username / nickname
- role（Tag）
- status（Tag）
- createdAt / lastLoginAt
- 操作：
  - 禁用/启用
  - 重置密码（生成临时密码或设置为默认初始密码策略）
  - 修改角色（下拉选择 + 二次确认）

**安全建议**：

- 禁止管理员改自己的角色（防误操作锁死后台）
- 重置密码需记录审计日志

### 2.7 组件级权限体现（体验层）

- 菜单入口用 `Access` 控制
- 表格“操作列”按钮按权限点显示/隐藏
- 对无权限操作：按钮禁用并给 Tooltip（如“仅管理员可操作”）

---

## 3. 后端接口设计（NestJS）

### 3.1 认证与 JWT Payload

登录成功后签发 JWT，payload 建议包含：

- `sub`：userId
- `username`
- `role`
- `permissions`（可选）

推荐策略：

- 最小版本：payload 只带 `role`，后端按 `role -> permissions` 映射
- 进阶：payload 带 `permissions`（需要 refresh/重新登录时更新）

### 3.2 Guard / Decorator 设计

建议在 NestJS 中实现：

- `JwtAuthGuard`：校验 token
- `PermissionsGuard`：校验权限点
- `@RequirePermissions(...perms)`：声明接口需要的权限点

示例（概念）：

- `@UseGuards(JwtAuthGuard, PermissionsGuard)`
- `@RequirePermissions('manage:admin', 'user:read')`

### 3.3 管理员 API（REST 版本）

#### 3.3.1 Dashboard

- `GET /api/admin/dashboard`
  - 返回：待审核数、今日新增问卷/用户、发布总数、最近审核记录

#### 3.3.2 全量问卷管理

- `GET /api/admin/questions`
  - query：`page`, `pageSize`, `keyword`, `owner`, `isPublished`, `auditStatus`, `featured`, `pinned`, `createdAtStart`, `createdAtEnd`
  - 返回：分页列表（含 owner 简要信息）

- `PATCH /api/admin/questions/:id/publish`
  - 强制发布（可选）

- `PATCH /api/admin/questions/:id/unpublish`
  - 强制下架

- `PATCH /api/admin/questions/:id/feature`
  - body：`{ featured: boolean, pinned: boolean }`

- `GET /api/admin/questions/:id`
  - 返回问卷详情 + 最近操作日志（可选）

#### 3.3.3 审核队列

- `GET /api/admin/reviews`
  - query：`status=pending|approved|rejected`, `page`, `pageSize`

- `POST /api/admin/reviews/:questionId/approve`
  - body：`{ autoPublish?: boolean }`

- `POST /api/admin/reviews/:questionId/reject`
  - body：`{ reason: string }`

#### 3.3.4 用户管理

- `GET /api/admin/users`
  - query：`page`, `pageSize`, `keyword`, `role`, `status`

- `PATCH /api/admin/users/:id/status`
  - body：`{ status: 'active' | 'disabled' }`

- `PATCH /api/admin/users/:id/role`
  - body：`{ role: 'user' | 'admin' }`

- `POST /api/admin/users/:id/reset-password`
  - body（推荐最小契约）：`{ strategy: 'random' | 'default' }`
    - `default`：使用 `DEFAULT_RESET_PASSWORD`（默认 `123456`，长度需 6~12）
    - `random`：生成随机临时密码
  - 返回（200）：
    - `mustChangePassword: true`（固定为 true）
    - `strategy: 'random' | 'default'`
    - `newPassword?: string`（仅 random 时返回；只显示一次）
  - 安全说明：
    - 数据库存储为 bcrypt hash（不保存明文）
    - `newPassword` 仅用于管理员端一次性展示（建议展示后提示用户尽快修改）

#### 3.3.5 用户侧强制改密（配合重置密码）

- 用户信息：`GET /api/user/info`
  - 返回：`{ username, nickname, role, mustChangePassword }`
- 用户改密：`PATCH /api/user/password`
  - 成功后：更新密码 hash，并将 `mustChangePassword=false`
  - 前端可提示重新登录（按你现有改密流程）

> 返回结构建议统一：`{ errno: 0, data, msg }`（与你前端 axios 拦截器一致）

### 3.4 普通用户 API 补充（与审核流程相关）

为配合审核引入的新状态，普通用户侧建议增加：

- `POST /api/question/:id/submit-review`
  - 提交审核，设置 `auditStatus=PendingReview`

- `GET /api/question/:id`
  - 返回 `auditStatus` 与 `auditReason`（用于展示驳回原因）

发布策略建议：

- 若引入审核：普通用户调用 `publish` 时后端检查 `auditStatus === Approved` 才允许发布

---

## 4. 数据库设计（MongoDB Collections）

### 4.1 users

字段建议：

- `_id: ObjectId`
- `username: string`（唯一索引）
- `passwordHash: string`
- `nickname: string`
- `role: 'user' | 'admin'`
- `status: 'active' | 'disabled'`
- `createdAt: Date`
- `updatedAt: Date`
- `lastLoginAt?: Date`

索引建议：

- `username` unique
- `role + status` 组合索引（用户管理筛选）

### 4.2 questionnaires（问卷主表）

在你现有问卷结构上，建议新增“审核/运营”字段：

- `ownerId: ObjectId`
- `title: string`
- `componentList: any[]`（按你现有结构）
- `isPublished: boolean`
- `isDeleted: boolean`（回收站语义）
- `isStar: boolean`（星标语义：**问卷私有字段**，仅对 owner 生效）

新增：

- `auditStatus: 'Draft' | 'PendingReview' | 'Approved' | 'Rejected'`
- `auditReason?: string`（最后一次驳回原因）
- `auditUpdatedAt?: Date`
- `featured: boolean`（推荐）
- `pinned: boolean`（置顶）
- `pinnedAt?: Date`

索引建议：

- `ownerId + createdAt`
- `auditStatus + auditUpdatedAt`（审核队列）
- `pinned + pinnedAt`（置顶排序）
- `featured`（推荐过滤）

> 你已确认：`isStar` 为问卷私有字段（owner 维度）。因此无需额外的星标关联表，查询也可直接在问卷表按 `ownerId + isStar` 过滤。

### 4.3 questionnaire_reviews（审核记录表）

用于保存历史审核记录（避免 audit 字段只保留最后一次）。

- `questionId: ObjectId`
- `ownerId: ObjectId`
- `submitterId: ObjectId`
- `reviewerId?: ObjectId`
- `status: 'PendingReview' | 'Approved' | 'Rejected'`
- `reason?: string`
- `submittedAt: Date`
- `reviewedAt?: Date`
- `snapshot?: object`（可选：保存当次提交的问卷快照/版本号）

索引：

- `status + submittedAt`
- `questionId + submittedAt`

### 4.4 audit_logs（审计日志表，强烈建议）

记录“谁在什么时候做了什么”，用于追责与排障。

- `actorId: ObjectId`
- `actorRole: string`
- `action: string`（如 `USER_DISABLE`, `QUESTION_PIN`, `REVIEW_APPROVE`）
- `targetType: 'user' | 'question' | 'review'`
- `targetId: ObjectId`
- `meta: object`（差异字段、原因等）
- `createdAt: Date`

---

## 5. 关键业务流程（状态机 + 规则）

### 5.1 问卷生命周期（推荐状态机）

- Draft（草稿）
- PendingReview（待审核）
- Approved（已通过）
- Rejected（已驳回）
- Published（已发布，通常与 `isPublished=true` 对齐）
- Unpublished（下架，`isPublished=false`）

建议规则：

- 普通用户：
  - Draft → PendingReview（提交审核）
  - PendingReview：不可发布、不可重复提交
  - Rejected：修改后允许再次提交（回 Draft 或直接 PendingReview）
  - Approved：允许发布
- 管理员：
  - 可直接 Approved / 直接发布（可选）
  - 可强制下架（不改审核状态或单独记录）

### 5.2 审核通过与发布策略

两种方案（二选一）：

1. 通过即发布：审核通过后 `isPublished=true`（简单，运营强）
2. 通过不自动发布：审核通过只标记 `Approved`，由用户主动发布（更符合“用户掌控”）

你已确认采用：**方案 2（不自动发布）**，并在审核接口中提供 `autoPublish` 参数（管理员可选择“通过并发布”）。

### 5.3 置顶/推荐

- `pinned`：影响排序，置顶时间越新越靠前
- `featured`：用于首页/推荐位筛选

注意：置顶/推荐应与“发布状态”联动：

- 未发布问卷置顶意义不大，可在后端禁止或自动下架时清除置顶。

---

## 6. 迭代落地顺序（强烈建议按这个推进）

### 第 1 步：权限最小闭环（1~2 天）

- 后端：JWT 增加 role；新增 `PermissionsGuard`；管理员路由整体保护
- 前端：
  - `role` 写入 store
  - 管理后台入口仅 admin 可见
  - 非 admin 访问后台路由跳 403

### 第 2 步：审核流闭环（2~4 天）

- 增加 `auditStatus` 字段与审核记录表
- 普通用户：提交审核
- 管理员：审核队列 + 通过/驳回
- 发布接口增加审核校验

### 第 3 步：全量问卷与运营能力（2~4 天）

- 管理员全量问卷列表 + 强制下架/恢复
- 置顶/推荐
- Dashboard 指标

### 第 4 步：用户管理（2~4 天）

- 用户列表
- 禁用/启用、重置密码、角色调整
- 审计日志完善

---

## 7. 前后端返回结构与分页规范（建议统一）

### 7.1 统一返回结构

- 成功：`{ errno: 0, data: ..., msg?: string }`
- 失败：`{ errno: 非0, msg: '...' }`

### 7.2 分页返回

建议列表统一：

- `list: T[]`
- `count: number`
- `page: number`
- `pageSize: number`

---

## 8. 风险与注意事项

- 前端隐藏按钮 ≠ 安全：必须后端校验。
- 管理员操作要有二次确认（下架、禁用、改角色）。
- 建议对管理员关键操作写审计日志（否则后期难排查）。
- 建议对“修改自己角色/禁用自己”做硬限制。

---

## 9. 你需要提供/确认的 3 个决策点（不影响先做 MVP）

已确认：

- 审核通过：不自动发布；支持 `autoPublish`
- 角色：仅 `admin`
- `isStar`：问卷私有字段（owner 维度）

仍需确认：无。

---

## 10. 可执行任务清单（按迭代拆分，便于分 PR）

> 目标：每个阶段都能独立上线且可验证。

### 10.1 迭代 A：RBAC 最小闭环（只做 admin）

后端（NestJS）：

- 用户表补 `role`、`status` 字段（默认 `role=user`、`status=active`）
- 登录 JWT payload 写入 `role`
- 增加权限映射（`role -> permissions`）与 `PermissionsGuard`
- 新增一个测试用接口：`GET /api/admin/ping`（需要 `manage:admin`），用于快速验证 Guard

前端（React）：

- 读取 `/api/user/info` 时拿到 `role` 并落 Redux
- 增加 `Access` 组件，菜单入口按权限点渲染
- 增加 `/manage/admin` 与 `/403` 页面，非 admin 跳 403

验收标准：

- 普通用户不可访问任何 `/manage/admin/*`
- 管理员可访问 `/manage/admin`

### 10.2 迭代 B：审核流闭环（不自动发布 + autoPublish 可选）

数据库（MongoDB）：

- questionnaires 增加：`auditStatus`、`auditReason`、`auditUpdatedAt`
- 增加 `questionnaire_reviews`（审核历史）

后端（NestJS）：

- 用户提交审核：`POST /api/question/:id/submit-review`
  - 规则：仅 owner；必须未发布或允许已发布改版（按你业务取舍）；从 Draft/Rejected 进入 PendingReview
- 管理员审核列表：`GET /api/admin/reviews?status=pending`
- 管理员通过：`POST /api/admin/reviews/:questionId/approve { autoPublish?: boolean }`
  - 规则：写入审核记录；更新问卷 `auditStatus=Approved`
  - 若 `autoPublish=true`：同时设置 `isPublished=true`
- 管理员驳回：`POST /api/admin/reviews/:questionId/reject { reason }`
  - 规则：写入审核记录；更新问卷 `auditStatus=Rejected` 与 `auditReason`
- 发布接口加校验：普通用户发布必须 `auditStatus===Approved`

前端（React）：

- 普通用户在编辑页增加“提交审核”按钮（根据状态禁用/提示）
- 管理员审核页：表格 + Drawer 预览 + 通过/驳回（驳回必填原因）
- 普通用户问卷列表/详情展示审核状态与驳回原因

验收标准：

- 普通用户未通过审核无法发布
- 管理员可选择“通过”或“通过并发布”
- 驳回原因能在普通用户侧看到

### 10.3 迭代 C：全量问卷管理 + 置顶/推荐

数据库（MongoDB）：

- questionnaires 增加：`featured`、`pinned`、`pinnedAt`

后端（NestJS）：

- `GET /api/admin/questions`（带多条件筛选 + owner 简要信息）
- `PATCH /api/admin/questions/:id/unpublish` 强制下架
- `PATCH /api/admin/questions/:id/feature { featured, pinned }`

前端（React）：

- 管理员全量问卷列表：筛选 Form + Table
- 运营操作：置顶/推荐开关（建议二次确认）
- 强制下架/恢复（Popconfirm）

验收标准：

- 管理员可查看任意用户问卷
- 置顶/推荐在列表即时可见并可筛选

### 10.4 迭代 D：用户管理

后端（NestJS）：

- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/status`
- `PATCH /api/admin/users/:id/role`（禁止修改自己）
- `POST /api/admin/users/:id/reset-password`（写审计日志）

前端（React）：

- 用户管理列表：筛选 + Table
- 操作：禁用/启用、重置密码、改角色（均二次确认）

验收标准：

- 禁用后该用户无法登录或无法访问受保护资源（按你的登录策略实现）
- 管理员不可把自己降权

### 10.5 迭代 E：审计日志（推荐）

后端（NestJS）：

- 关键管理员操作写入 `audit_logs`
- 可选提供 `GET /api/admin/audit-logs` 用于追踪

验收标准：

- 下架/禁用/改角色/审核通过驳回都有日志可查
