# SSO 回调修复文档

> 解决 B 端登录成功后回到 C 端，登录态未生效（TopBar 仍显示"登录"按钮）的问题。

---

## 一、问题现象

用户在 C 端点击「登录」→ 跳转到 B 端登录页 → 输入账号密码登录成功 → 跳回 C 端后 **TopBar 仍显示未登录状态**，`auth()` 返回 `null`。

## 二、根因分析

### 跨域 Cookie 无法设置

B 端 (`localhost:8000`) 与 C 端 (`localhost:3000`) 是 **不同 Origin**（端口不同）。

原有设计中，B 端登录成功后会调用 C 端的 next-auth 认证接口 (`/api/auth/callback/credentials`)，期望 C 端返回 `Set-Cookie` 头来设置 Session Cookie。但这存在根本性问题：

| 调用方式 | 失败原因 |
|---------|---------|
| **B 端服务端调用** | `Set-Cookie` 响应头返回给了 B 端 Node 服务器，不会到达用户浏览器 |
| **B 端客户端 AJAX（fetch/axios）** | 跨域请求中，`SameSite=Lax` 的 Cookie 会被浏览器安全策略拦截，不会写入 |

因此无论哪种方式，用户浏览器上都 **不会存在** `authjs.session-token` Cookie，回到 C 端后 `auth()` 自然返回 `null`。

### 核心原则

> **Cookie 只能由与目标域同源的页面/响应来设置。**
>
> 要在 `localhost:3000` 域下设置 Cookie，浏览器必须直接访问 `localhost:3000` 的端点，由该端点的响应头来 `Set-Cookie`。

## 三、解决方案

### 新增 C 端 SSO 回调端点

创建 API Route：`/api/auth/sso-callback`

- **文件路径**：`src/app/api/auth/sso-callback/route.ts`
- **职责**：接收 B 端登录成功后的浏览器重定向，在 C 端域名下设置 Session Cookie，然后跳转到目标页面。

### 工作原理

1. B 端登录成功后，将用户浏览器 **直接重定向**（`window.location.href`）到 C 端的 `/api/auth/sso-callback`
2. 该端点使用 next-auth 的 `encode()` 函数生成加密 JWT（与正常登录产出格式完全一致）
3. 通过 `Set-Cookie` 将 JWT 写入 `authjs.session-token` Cookie
4. 302 重定向到最终目标页面（callbackUrl）

因为浏览器是 **直接访问** C 端域名（`localhost:3000`），所以 `Set-Cookie` 可以正常生效。

## 四、修正后的完整登录流程

```
用户点击登录
      │
      ▼
┌──────────────────────────────────────────────────────────┐
│ ① C 端 TopBar「登录」按钮                                  │
│    302 → B端/login?callbackUrl=C端首页&authBase=C端域名     │
└──────────────────────────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────────────────────┐
│ ② B 端登录页                                              │
│    用户输入用户名/密码                                       │
│    POST 后端 /api/user/login                               │
│    → 获得 { token: "access_token", username: "xxx" }       │
└──────────────────────────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────────────────────┐
│ ③ B 端重定向浏览器到 C 端 SSO 回调                           │
│    window.location.href =                                  │
│      ${authBase}/api/auth/sso-callback                     │
│        ?token=access_token                                 │
│        &username=xxx                                       │
│        &callbackUrl=最终要回到的C端页面                       │
└──────────────────────────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────────────────────┐
│ ④ C 端 /api/auth/sso-callback（本次新增）                   │
│    a. 读取 URL 参数中的 token、username、callbackUrl         │
│    b. 使用 next-auth encode() 加密生成 JWT                  │
│    c. Set-Cookie: authjs.session-token=<JWT>               │
│       (httpOnly, SameSite=Lax, path=/, maxAge=30天)        │
│    d. 302 重定向到 callbackUrl                              │
└──────────────────────────────────────────────────────────┘
      │
      ▼
┌──────────────────────────────────────────────────────────┐
│ ⑤ C 端目标页面（如首页）                                     │
│    auth() 读取 Cookie → session 存在 → TopBar 显示用户名 ✓  │
└──────────────────────────────────────────────────────────┘
```

## 五、SSO 回调端点参数说明

### 请求方式

```
GET /api/auth/sso-callback?token=xxx&username=xxx&callbackUrl=xxx
```

### 参数列表

| 参数 | 必填 | 说明 | 示例 |
|------|------|------|------|
| `token` | ✅ | 后端签发的 access_token | `eyJhbGci...` |
| `username` | ✅ | 登录用户的用户名 | `zhangsan` |
| `callbackUrl` | ❌ | 登录完成后跳转的目标页面，默认 `/` | `http://localhost:3000/templates` |

### 响应

- **成功**：302 重定向到 callbackUrl，同时 Set-Cookie 写入 Session
- **缺少参数**：400 JSON 错误提示

## 六、B 端接入指南

### B 端登录页需要做的事

B 端的登录页  `/login` 会收到以下 URL 参数：

| 参数 | 来源 | 说明 |
|------|------|------|
| `callbackUrl` | C 端传入 | 登录成功后最终要回到的 C 端页面 |
| `authBase` | C 端传入 | C 端域名，用于拼接 SSO 回调 URL |

### B 端登录成功后的代码示例

```javascript
// B 端登录页：用户提交表单 → 调用后端 API 验证
async function handleLogin(username, password) {
  // 1. 调用后端 API 验证用户名密码
  const res = await fetch('http://后端地址/api/user/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const json = await res.json();

  if (json.errno !== 0) {
    alert('登录失败：' + json.msg);
    return;
  }

  // 2. 从 URL 参数中读取 authBase 和 callbackUrl
  const params = new URLSearchParams(window.location.search);
  const authBase = params.get('authBase');       // C 端域名
  const callbackUrl = params.get('callbackUrl'); // 最终回跳地址

  // 3. 判断是否需要 SSO 回调（从 C 端跳过来的场景）
  if (authBase && callbackUrl) {
    // ★ 关键步骤：重定向到 C 端 SSO 回调端点
    const ssoUrl = new URL('/api/auth/sso-callback', authBase);
    ssoUrl.searchParams.set('token', json.data.token);       // 后端返回的 access_token
    ssoUrl.searchParams.set('username', json.data.username);  // 用户名
    ssoUrl.searchParams.set('callbackUrl', callbackUrl);      // 最终回跳地址
    window.location.href = ssoUrl.toString();
  } else {
    // 非 SSO 场景（B 端自己的登录），留在 B 端
    window.location.href = '/manage/list';
  }
}
```

### 重要注意事项

1. **不要用 AJAX 调用 C 端认证接口**：跨域请求的 `Set-Cookie` 会被浏览器拦截
2. **必须用浏览器重定向**（`window.location.href`）到 C 端 SSO 回调端点
3. **token 明文传输**：开发环境可接受，生产环境**必须使用 HTTPS**，防止 URL 中 token 被窃听
4. **B 端也需要自己的登录态**：如果 B 端也需要维持登录状态，应在跳转到 C 端之前先设置好 B 端自己的 Cookie/Token

## 七、涉及的文件变更

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/app/api/auth/sso-callback/route.ts` | **新增** | SSO 回调端点，生成加密 JWT 并设置 Cookie |
| `src/app/auth/signin/route.ts` | 更新注释 | 文档中增加 SSO 回调流程说明，移除旧的"调用 callback/credentials"描述 |
| `src/components/TopBar/index.tsx` | 更新注释 | 登录按钮处的注释修正为 SSO 回调流程 |
| `src/app/templates/_components/UseTemplateButton.tsx` | 更新注释 | 401 处理流程注释修正为 SSO 回调流程 |

## 八、环境变量清单

```env
# .env.local

# next-auth 加密密钥（SSO 回调端点用于 JWT 加密，必须与 auth.ts 共享）
AUTH_SECRET=replace_with_strong_random_secret_32_chars_min

# C 端域名
NEXTAUTH_URL=http://localhost:3000

# 后端 API 地址
BACKEND_API_BASE=http://localhost:8080

# B 端地址
NEXT_PUBLIC_B_APP_ORIGIN=http://localhost:8000
```

## 九、安全考量

| 风险点 | 措施 |
|-------|------|
| URL 中 token 明文传输 | 生产环境强制 HTTPS |
| Cookie 被前端 JS 读取 | `httpOnly: true`，JS 无法访问 |
| Cookie 在跨站请求中被发送 | `sameSite: 'lax'`，仅顶级导航时携带 |
| access_token 暴露给浏览器 | token 加密后存入 Cookie，`auth()` / `getToken()` 在服务端解密读取，前端永远看不到原始 token |
| Session 伪造 | JWT 使用 `AUTH_SECRET` 加密签名，无密钥无法伪造 |

## 十、测试验证步骤

1. 启动 C 端 (`npm run dev`，默认 `localhost:3000`)
2. 启动 B 端 (`localhost:8000`)
3. 访问 C 端首页，TopBar 应显示「登录」按钮
4. 点击「登录」→ 应跳转到 `localhost:8000/login?callbackUrl=...&authBase=...`
5. 在 B 端输入账号密码登录
6. B 端应重定向到 `localhost:3000/api/auth/sso-callback?token=...&username=...&callbackUrl=...`
7. 浏览器应自动跳转到 C 端首页
8. TopBar 应显示用户名和「退出登录」按钮 ✅
9. 打开 DevTools → Application → Cookies，应能看到 `authjs.session-token` Cookie
