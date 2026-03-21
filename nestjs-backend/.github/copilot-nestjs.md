你是一个经验丰富的 NestJS 开发者，正在为本仓库（question-server-nestjs）编写/修改代码。

目标：生成“能直接落在现有代码里”的实现，优先遵循项目既有约定，其次才是通用最佳实践。

## 1) 项目约定（强制遵循）

1. **技术栈与版本对齐**
   - 当前项目使用 NestJS v11 + TypeScript（禁止使用 any）。
   - Web 框架为 Express；路由全局前缀为 `/api`（不要在 Controller path 里手动拼 `/api`）。

2. **统一响应格式（非常重要）**
   - 项目已启用全局响应拦截器 `TransformInterceptor`：会把你在 Controller/Service 里 `return` 的数据包装为 `{ errno: 0, data }`。
   - 因此：业务代码只返回“数据本体”，不要再手动返回 `{ errno, data }`、`{ statusCode, message }` 之类的外壳，避免重复包装。

3. **统一异常格式（非常重要）**
   - 项目已启用全局异常过滤器 `HttpExceptionFilter`：捕获 `HttpException` 并返回 `{ errno: -1, message, timestamp, path }`。
   - 因此：错误场景请直接 `throw new BadRequestException('...') / NotFoundException('...') / ForbiddenException('...') / UnauthorizedException('...')`。
   - 不要用 `return` 返回错误对象；不要自己拼 errno/message 结构。

4. **鉴权与路由访问控制（按现有实现）**
   - 项目通过 `APP_GUARD` 全局启用了自定义 `AuthGuard`：默认所有接口都需要登录（JWT）。
   - Token 从 `Authorization: Bearer <token>` 读取；解码后的 payload 会被挂到 `req.user`。
   - 如需放行：使用装饰器 `@Public()`。
   - 如需“可选鉴权”（有 token 则识别用户，没有也放行）：使用 `@OptionalAuth()`，并确保在代码里对 `req.user` 做可空处理。

5. **数据库层（本项目是 MongoDB + Mongoose，不是 TypeORM/Prisma）**
   - 使用 `@nestjs/mongoose` + `mongoose`。
   - Schema 放在 `src/**/schemas/*.schema.ts`，Service 里用 `@InjectModel()` 注入 `Model<...Document>`。
   - 涉及 `findById`/`update` 的接口：先用 `mongoose.Types.ObjectId.isValid(id)` 做 id 校验，避免 CastError。
   - 只在 Service 处理数据访问；Controller 不直接操作 Model。

6. **配置读取（按现有实现）**
   - 项目已启用 `ConfigModule.forRoot()`。
   - 业务代码优先使用 `ConfigService`（例如 AI 配置使用 `AIConfigService`），尽量避免在 Service 里散落 `process.env`。

7. **返回结构、分页结构、错误语义（强制模板）**
   - 统一成功外壳由全局拦截器负责：你在业务代码里只返回 `data`。
     - ✅ 正确：`return { list, count }` / `return question` / `return { stat }`
     - ❌ 错误：`return { errno: 0, data: ... }` / `return { message, statusCode }`
   - 列表分页的 data 统一用：`{ list: T[]; count: number }`
     - `count` 表示满足条件的总数量（不是当前页数量）。
     - 新增列表接口时优先沿用 query 命名：`pageNum` + `pageSize`（字符串入参，Controller 内转 number 并给默认值）。
     - 如需与现有模块保持一致（例如 stat 已使用 `page` + `pageSize`），则沿用模块内既有命名。
   - 错误语义只通过抛异常表达（由全局过滤器统一序列化）：
     - 未登录/缺 token：`throw new UnauthorizedException('未登录')`
     - token 无效/过期：`throw new UnauthorizedException('token 失效')`
     - 无权限：`throw new ForbiddenException('无权访问')`（message 按业务细化，例如“无权访问未发布问卷”）
     - 参数不合法：`throw new BadRequestException('xxx')`
     - 资源不存在：`throw new NotFoundException('xxx不存在')`
   - message 规范：中文、简短、可直接给前端 toast 展示；不要抛出原始 error 对象或堆栈信息给客户端。

## 2) 代码组织与风格（优先遵循）

1. **模块结构与落地路径**
   - 按现有模块组织：`module / controller / service / dto / schemas`。
   - 新增能力时：同步更新对应 `*.module.ts` 的 providers/imports/exports（保持可注入）。

2. **RESTful 设计（与项目现有路由风格一致）**
   - 资源路径使用名词：例如 `question`、`answer`、`user`；方法使用 `GET/POST/PATCH/DELETE`。
   - 需要批量操作时可使用明确的子路径（例如 `POST /question/import`、`POST /question/:id/import` 这类“动作型”路由，保持与现有一致）。

3. **常见路由示例（按当前仓库）**
   - 说明：以下路径默认带全局前缀 `/api`。
   - 成功响应只描述 `data` 的形状（外层会自动包 `{ errno: 0, data }`）。
   - `question`（默认需要登录，部分接口可选鉴权）
     - `GET /api/question` 查询列表，query 常见字段：`keyword`, `pageNum`, `pageSize`, `isDeleted`, `isStar`；data: `{ list, count }`
     - `GET /api/question/:id`（`@OptionalAuth()`）data: `Question`
     - `GET /api/question/:id/export` data: 导出结构（以 service 返回为准）
     - `POST /api/question` data: `Question`
     - `PATCH /api/question/:id` data: `QuestionUpdateResult`
     - `DELETE /api/question/:id` data: `Question | null`
     - `DELETE /api/question` body: `{ ids: string[] }` data: 批量删除结果（以 service 返回为准）
     - `POST /api/question/import` body: `unknown` data: `Question`
     - `POST /api/question/:id/import` body: `unknown` data: `QuestionUpdateResult`
     - `POST /api/question/duplicate/:id` data: `Question`
     - `POST /api/question/ai-generate` body: `{ prompt: string }` data: `AIGenerateQuestionResponse`
   - `answer`（公开接口）
     - `POST /api/answer`（`@Public()`）body: `unknown` data: `Answer`
   - `stat`（需要登录）
     - `GET /api/stat/:questionId` query: `page`, `pageSize` data: `{ list, count }`（以 service 返回为准）
     - `GET /api/stat/:questionId/:componentFeId` data: `{ stat }`
   - `auth`（登录公开，profile 需登录）
     - `POST /api/auth/login`（`@Public()`）body: `{ username, password }` data: 登录结果（token 等，以 service 返回为准）
     - `GET /api/auth/profile` data: `req.user`（JWT payload）
   - `user`（注册公开；login/info 为重定向）
     - `POST /api/user/register`（`@Public()`）body: `{ username, password }` data: `User`
     - `GET /api/user/info` 302 -> `/api/auth/profile`
     - `POST /api/user/login` 307 -> `/api/auth/login`

4. **类型安全策略**
   - 不使用 `any`。
   - 对不可信输入（`@Body()` 等）优先用 `unknown` + 运行时校验/白名单清洗（项目里已有这种风格）。
   - 对 `req.user` 明确类型（例如 `{ user?: { username: string } }`），并处理可空情况。

5. **DTO 与校验（结合现状给出可执行方案）**
   - 项目依赖里已有 `class-validator`；但当前 `main.ts` 未启用全局 `ValidationPipe`。
   - 如果你要新增/强化 DTO 校验：
     - 方案 A：在 `main.ts` 增加全局 `ValidationPipe`（需评估对现有接口的兼容性）。
     - 方案 B：只在新增 Controller 方法上使用 `@UsePipes(new ValidationPipe(...))`，避免影响存量接口。
   - 如果不引入 Pipe：就沿用“unknown + 手动校验/白名单”的方式。

6. **日志**
   - 开发期可用 `console.log`，但建议在新增复杂逻辑时使用 Nest 的 `Logger`（不要打印敏感信息，如 token、密码、API Key）。

## 3) 输出要求（让代码可以直接合并）

当你要实现一个需求或修改点时：

1. 先列出需要改动/新增的文件清单（按本仓库真实路径）。
2. 给出可直接编译通过的 TypeScript 代码（保持现有风格、不要大规模重构无关代码）。
3. 说明接口的请求/响应示例：
   - 成功只描述 `data` 结构（因为外层会自动包 `{ errno: 0, data }`）。
   - 失败说明会抛出的异常类型与 message（因为外层会统一包 `{ errno: -1, message, ... }`）。

请始终以“符合本项目约定”为第一优先级生成 NestJS 代码。

<!-- end -->

(文件结束)
