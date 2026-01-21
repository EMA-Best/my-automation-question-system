# RBAC 后端接口与数据库设计（基于现有 NestJS + MongoDB 实现）

适用代码库：question-server-nestjs（NestJS + Mongoose）

本文件把 [ADMIN_RBAC_FLOW_DESIGN.md](ADMIN_RBAC_FLOW_DESIGN.md) 里的“理想字段/接口”映射到你当前工程的实际结构（当前问卷以 `author: username` 作为归属字段，而不是 `ownerId`）。

---

## 1. 数据库（Mongoose Schema）设计

### 1.1 users（现状 + 扩展）

现状字段：

- `username`（unique）
- `password`（当前为明文/未加密；后续可演进为 hash）
- `nickname`

已落地扩展字段（迭代A）：

- `role: 'user' | 'admin'`（默认 user）
- `status: 'active' | 'disabled'`（默认 active）
- `lastLoginAt?: Date`

索引建议：

- `username` unique（已有）
- `role + status` 组合索引（已加）

> 后续如果要安全升级：新增 `passwordHash` 并逐步迁移，不建议直接重命名 `password` 破坏现有登录。

### 1.2 questions（问卷主表：在现有结构上加审核/运营字段）

现状字段（核心）：

- `title/desc/js/css/componentList`
- `author: string`（用户名，当前用它表示归属）
- `isPublished/isStar/isDeleted`

建议新增字段（迭代B/C）：

- 审核：
  - `auditStatus: 'Draft' | 'PendingReview' | 'Approved' | 'Rejected'`
  - `auditReason?: string`
  - `auditUpdatedAt?: Date`
- 运营：
  - `featured: boolean`
  - `pinned: boolean`
  - `pinnedAt?: Date`

索引建议：

- `author + createdAt`（便于个人列表）
- `auditStatus + auditUpdatedAt`（审核队列）
- `pinned + pinnedAt`（置顶排序）

> 你当前用 `author: username`。如果未来要支持“用户名可变更”，建议改为 `ownerId: ObjectId` 并保留 `authorSnapshot`。

### 1.3 question_reviews（审核记录表）

建议新建集合（迭代B）：

- `questionId: ObjectId`
- `author: string`（与 question.author 对齐，做冗余便于查）
- `submitter: string`
- `reviewer?: string`
- `status: 'PendingReview' | 'Approved' | 'Rejected'`
- `reason?: string`
- `submittedAt: Date`
- `reviewedAt?: Date`
- `snapshot?: object`（可选：保存提交快照，便于追溯）

索引建议：

- `status + submittedAt`
- `questionId + submittedAt`

### 1.4 audit_logs（审计日志表）

建议新建集合（迭代D）：

- `actor: string`
- `actorRole: 'user' | 'admin'`
- `action: string`（如 `USER_DISABLE`, `QUESTION_PIN`, `REVIEW_APPROVE`）
- `targetType: 'user' | 'question' | 'review'`
- `targetId: string`
- `meta: object`
- `createdAt: Date`

---

## 2. 权限点与后端校验策略

权限点来自原文档：

- `manage:admin`
- `user:read` `user:update` `user:resetPassword`
- `question:read:any` `question:update:any` `question:feature`
- `review:read` `review:approve` `review:reject`

策略：

- JWT payload 至少包含 `username` 与 `role`
- 后端使用 `@RequirePermissions(...)` 声明权限点
- `PermissionsGuard` 通过 `role -> permissions` 映射做强制校验

---

## 3. 管理员接口（建议清单）

### 3.1 验证接口（已落地）

- `GET /api/admin/ping`
  - 权限：`manage:admin`

### 3.2 Dashboard

- `GET /api/admin/dashboard`
  - 权限：`manage:admin`
  - 返回：待审核数、今日新增问卷/用户、发布总数、最近审核记录

### 3.3 全量问卷管理

- `GET /api/admin/questions`
  - 权限：`question:read:any`
  - query：`page pageSize keyword author isPublished auditStatus featured pinned createdAtStart createdAtEnd`

- `GET /api/admin/questions/:id`
  - 权限：`question:read:any`

- `PATCH /api/admin/questions/:id/unpublish`
  - 权限：`question:update:any`

- `PATCH /api/admin/questions/:id/feature`
  - 权限：`question:feature`
  - body：`{ featured: boolean, pinned: boolean }`

### 3.4 审核队列

- `GET /api/admin/reviews`
  - 权限：`review:read`
  - query：`status page pageSize`

- `POST /api/admin/reviews/:questionId/approve`
  - 权限：`review:approve`
  - body：`{ autoPublish?: boolean }`

- `POST /api/admin/reviews/:questionId/reject`
  - 权限：`review:reject`
  - body：`{ reason: string }`

### 3.5 用户管理

- `GET /api/admin/users`
  - 权限：`user:read`

- `PATCH /api/admin/users/:id/status`
  - 权限：`user:update`
  - body：`{ status: 'active' | 'disabled' }`

- `PATCH /api/admin/users/:id/role`
  - 权限：`user:update`
  - body：`{ role: 'user' | 'admin' }`

- `POST /api/admin/users/:id/reset-password`
  - 权限：`user:resetPassword`

---

## 4. 普通用户接口补充（审核相关）

- `POST /api/question/:id/submit-review`
  - 仅作者可提交；Draft/Rejected -> PendingReview

- 发布校验：普通用户发布前必须 `auditStatus === Approved`（可作为迭代B的发布门禁）
