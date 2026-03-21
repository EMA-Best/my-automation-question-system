# C 端 SSO + TopBar 实施说明

> **实施日期**：2026-02-26  
> **涉及范围**：C 端（Next.js App Router）问卷填写以外的所有页面

---

## 一、本次实施内容概览

| 模块 | 文件 | 说明 |
|------|------|------|
| **SSO 核心配置** | `src/auth.ts` | next-auth v5 核心配置，含 Credentials Provider 过渡方案 |
| **Auth 路由** | `src/app/api/auth/[...nextauth]/route.ts` | next-auth 内置处理器（登录/回调/登出/session 查询） |
| **BFF 代理路由** | `src/app/api/proxy/[...path]/route.ts` | 服务端注入 Bearer Token，浏览器永远看不到 access_token |
| **统一登录页** | `src/app/auth/signin/page.tsx` | 账号密码表单，支持 callbackUrl 回跳 |
| **顶部状态栏** | `src/components/TopBar/index.tsx` | Server Component，服务端读 Session 展示登录状态 |
| **登出按钮** | `src/components/TopBar/SignOutButton.tsx` | Client Component（需要 onClick） |
| **TopBar 样式** | `src/components/TopBar/index.module.scss` | sticky 吸顶，响应式，渐变 Logo |
| **模板类型** | `src/types/template.ts` | TypeScript 类型定义 |
| **模板 Service** | `src/services/template.ts` | 公开接口直连后端；受保护接口走 BFF 代理 |
| **"使用此模板"按钮** | `src/app/templates/_components/UseTemplateButton.tsx` | Client Component，处理 401 跳转登录 |
| **回跳中转页** | `src/app/templates/use-callback/page.tsx` | 登录完成后自动触发 /use，跳转 B 端编辑器 |
| **环境变量模板** | `.env.local` | 配置 AUTH_SECRET / BACKEND_API_BASE 等 |

---

## 二、完整登录流程说明

### 流程 A：未登录用户点击"使用此模板"

```
用户点击"使用此模板"（UseTemplateButton）
  │
  ▼
POST /api/proxy/templates/:id/use
  │
  ├─ BFF 发现 Session 不存在 → 返回 401
  │
  ▼
UseTemplateButton 捕获到 status=401
  │
  ▼
router.push('/auth/signin?callbackUrl=/templates/use-callback?templateId=xxx')
  │
  ▼
用户在 /auth/signin 填写账号密码，点击登录
  │
  ▼
next-auth BFF 调用后端 /api/user/login，拿到 access_token
access_token 写入服务端加密 JWT（浏览器只收到 httpOnly Session Cookie）
  │
  ▼
next-auth 重定向到 callbackUrl：/templates/use-callback?templateId=xxx
  │
  ▼
use-callback 页面加载，useEffect 自动触发 POST /api/proxy/templates/:id/use
  │
  ├─ 成功：拿到 questionId
  │     │
  │     ▼
  │   window.location.href = B_APP_ORIGIN/question/edit/:questionId
  │
  └─ 失败（403/500）：显示错误提示 + "返回模板列表"入口
```

### 流程 B：已登录用户点击"使用此模板"

```
用户点击"使用此模板"
  │
  ▼
POST /api/proxy/templates/:id/use
  │
  ▼
BFF 检测到 Session 有效 → 从服务端 JWT 取出 access_token
→ 携带 Authorization: Bearer <token> 转发给后端
  │
  ▼
后端克隆模板，返回 { questionId }
  │
  ▼
window.location.href = B_APP_ORIGIN/question/edit/:questionId
```

---

## 三、环境变量配置（必读）

文件：`.env.local`（根目录，**不要提交到 Git**）

```env
# ★ 必填：用于加密 Session Cookie，生产环境务必用强随机值
# 生成命令：openssl rand -base64 32
AUTH_SECRET=your_strong_random_secret_here

# 本地开发时 C 端地址
NEXTAUTH_URL=http://localhost:3000

# ★ 必填：后端 API 基础地址（不带末尾斜杠）
BACKEND_API_BASE=http://localhost:3005

# B 端地址（"使用模板"成功后跳转到 B 端编辑页用）
# NEXT_PUBLIC_ 前缀在浏览器端可访问，其余变量仅服务端可访问
NEXT_PUBLIC_B_APP_ORIGIN=http://localhost:3001
```

> ⚠️ **`AUTH_SECRET` 绝对不能使用默认值或留空**，否则 Session Cookie 加密失效，
> 任何人都能伪造 Session。生产环境请用 `openssl rand -base64 32` 生成。

---

## 四、各页面 TopBar 使用规范

### ✅ 需要引入 TopBar 的页面

| 页面 | 路由 |
|------|------|
| 首页 | `/` |
| 模板列表页 | `/templates` |
| （未来新增的非填写页） | 任意 |

```tsx
import TopBar from '@/components/TopBar';

export default function SomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br ...">
      <TopBar /> {/* 放在最顶部，sticky 吸顶 */}
      <main>...</main>
    </div>
  );
}
```

### ❌ 不引入 TopBar 的页面（保持纯净答题体验）

| 页面 | 路由 | 原因 |
|------|------|------|
| 问卷填写页 | `/question/[id]` | 使用 PageWrapper，纯净填写体验 |
| 填写成功页 | `/success` | 同上 |

---

## 五、BFF 代理路由使用规范

所有**需要登录**的后端接口，在 C 端前端代码中都应通过 `/api/proxy/` 前缀访问，而不是直接请求后端。

```
前端（浏览器）        C 端 BFF（服务端）              后端
      │                      │                        │
      │  POST /api/proxy/    │                        │
      │  templates/:id/use   │                        │
      │─────────────────────▶│                        │
      │                      │ 读取 Session JWT       │
      │                      │ 取出 access_token      │
      │                      │                        │
      │                      │  POST /api/            │
      │                      │  templates/:id/use     │
      │                      │  Authorization: Bearer │
      │                      │───────────────────────▶│
      │                      │◀───────────────────────│
      │◀─────────────────────│                        │
```

| 接口类型 | 前端调用方式 | 说明 |
|----------|------------|------|
| 公开接口（无需登录） | `fetch('/api/xxx')` 或 Server Component 直接调用 BACKEND_API_BASE | 模板列表/详情等 |
| 受保护接口（需登录） | `fetch('/api/proxy/xxx')` | BFF 代理自动注入 Token |

---

## 六、安全注意点（生产上线前 checklist）

- [ ] **`AUTH_SECRET`** 已替换为足够强度的随机字符串（`openssl rand -base64 32`）
- [ ] **`NEXTAUTH_URL`** 已设为生产域名（`https://your-c-app.com`）
- [ ] **HTTPS**：Session Cookie 设置了 `Secure` 标志（Next.js 在 `NEXTAUTH_URL` 为 https 时自动设置）
- [ ] **`.env.local` 未提交到 Git**（已在 `.gitignore` 中或检查一遍）
- [ ] **后端 `/api/templates/:id/use`** 已做登录鉴权（校验 Bearer Token）
- [ ] **后端 `/api/templates`** 只返回 `templateStatus=published` 的模板
- [ ] **B 端与 C 端 Cookie 域**：若两端在同一父域（如 `*.example.com`），可共享 Session Cookie；否则 B 端需通过调用 `C端 /api/auth/session` 获取登录状态

---

## 七、切换到标准 OIDC Provider

当你有了独立的 OIDC Provider（如 Keycloak、Auth0、自建 SSO）时，只需修改 `src/auth.ts`：

```diff
// src/auth.ts
providers: [
-  Credentials({
-    name: '账号密码登录',
-    credentials: { ... },
-    async authorize(credentials) { ... },
-  }),
+  {
+    id: 'your-oidc',
+    name: '统一认证',
+    type: 'oidc',
+    issuer: process.env.OIDC_ISSUER,
+    clientId: process.env.OIDC_CLIENT_ID,
+    clientSecret: process.env.OIDC_CLIENT_SECRET,
+  },
],
```

同时在 `.env.local` 中补充：

```env
OIDC_ISSUER=https://your-auth-server.com
OIDC_CLIENT_ID=xxx
OIDC_CLIENT_SECRET=xxx
```

**其他代码（BFF 代理、TopBar、UseTemplateButton、use-callback 页面）完全不需要改动。**

---

## 八、本地开发启动步骤

```bash
# 1. 安装依赖（首次）
npm install

# 2. 配置环境变量（首次）
# 编辑 .env.local，填写 AUTH_SECRET 和 BACKEND_API_BASE

# 3. 启动开发服务器
npm run dev

# C 端访问地址：http://localhost:3000
# 模板列表页：  http://localhost:3000/templates
# 登录页：      http://localhost:3000/auth/signin
```

---

## 九、目录结构（本次新增部分）

```
src/
├── auth.ts                              ← next-auth 核心配置（SSO BFF）
├── types/
│   └── template.ts                      ← 模板相关 TypeScript 类型
├── services/
│   └── template.ts                      ← 模板 API Service（公开 + 受保护）
├── components/
│   └── TopBar/
│       ├── index.tsx                    ← 顶部状态栏（Server Component）
│       ├── index.module.scss            ← TopBar 样式
│       └── SignOutButton.tsx            ← 登出按钮（Client Component）
└── app/
    ├── page.tsx                         ← 首页（已加入 TopBar）
    ├── api/
    │   ├── auth/
    │   │   └── [...nextauth]/
    │   │       └── route.ts             ← next-auth 内置路由处理器
    │   └── proxy/
    │       └── [...path]/
    │           └── route.ts             ← BFF 代理（服务端注入 Bearer Token）
    ├── auth/
    │   └── signin/
    │       └── page.tsx                 ← 统一登录页
    └── templates/
        ├── page.tsx                     ← 模板列表页（已加入 TopBar + UseTemplateButton）
        ├── _components/
        │   └── UseTemplateButton.tsx    ← "使用此模板"按钮（Client Component）
        └── use-callback/
            └── page.tsx                 ← 登录回跳中转页（自动触发 /use）
```
