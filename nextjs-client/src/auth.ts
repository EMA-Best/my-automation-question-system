/**
 * next-auth v5 核心配置
 * 认证 BFF 由 C 端 Next.js API Routes 承担，无需独立部署 Auth Center。
 * access_token 始终保留在服务端，浏览器仅持有 httpOnly 加密 Session Cookie。
 *
 * 过渡方案：使用 Credentials Provider 对接现有后端 /api/login。
 * 后续切换到标准 OIDC Provider 时，只需替换 providers 数组，其余代码几乎不变。
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

const useSecureCookies = process.env.NODE_ENV === "production";
// C 端会话统一有效期：1 天（与后端 JWT 1d 对齐，避免跨端登录态时长不一致）
const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;
const sessionCookieName = useSecureCookies
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";
const authSecret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

if (!authSecret) {
  throw new Error("缺少 AUTH_SECRET 或 NEXTAUTH_SECRET，无法初始化认证");
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    /** 仅存在于服务端 JWT，绝不暴露给浏览器 */
    accessToken?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  useSecureCookies,

  cookies: {
    sessionToken: {
      name: sessionCookieName,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },

  providers: [
    // -------------------------------------------------------
    // 过渡方案：Credentials Provider（对接现有后端 /api/login）
    // 切换到 OIDC 时，替换为 OIDC Provider 即可，其余不动
    // -------------------------------------------------------
    Credentials({
      name: "账号密码登录",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        try {
          // 获取后端 API 基础地址
          const backendBase = process.env.NEXT_PUBLIC_BACKEND_API_BASE || process.env.BACKEND_API_BASE;
          if (!backendBase) {
            throw new Error("缺少后端 API 基础地址配置");
          }
          
          const res = await fetch(
            `${backendBase.trim().replace(/\/+$/, "")}/api/user/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                username: credentials.username,
                password: credentials.password,
              }),
            },
          );

          if (!res.ok) return null;

          const json = await res.json();
          if (json.errno !== 0 || !json.data) return null;

          // json.data 应包含 { token, username, ... }
          return {
            id: json.data.username ?? String(json.data.id ?? ""),
            name: json.data.username,
            email: json.data.email ?? null,
            // 将 access_token 挂在这里，由 jwt 回调写入 token（服务端专属）
            accessToken: json.data.token,
          } as {
            id: string;
            name: string;
            email: string | null;
            accessToken: string;
          };
        } catch (err) {
          console.error("[auth] authorize error:", err);
          return null;
        }
      },
    }),

    // -------------------------------------------------------
    // 标准 OIDC Provider（准备好 OIDC Provider 后取消注释）
    // -------------------------------------------------------
    // {
    //   id: 'your-oidc',
    //   name: '统一认证',
    //   type: 'oidc',
    //   issuer: process.env.OIDC_ISSUER,
    //   clientId: process.env.OIDC_CLIENT_ID,
    //   clientSecret: process.env.OIDC_CLIENT_SECRET,
    // },
  ],

  session: {
    strategy: "jwt", // token 存于加密的 httpOnly Cookie，不发给浏览器
    maxAge: SESSION_MAX_AGE_SECONDS,
  },

  callbacks: {
    async jwt({ token, user }) {
      // 登录时将 access_token 写入服务端 JWT 负载
      if (user && (user as { accessToken?: string }).accessToken) {
        token.accessToken = (user as { accessToken?: string }).accessToken;
      }
      // 保存用户信息到 token
      if (user) {
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      // 发给浏览器的 session 只含脱敏用户信息（无 access_token）
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      // 不把 accessToken 放入 session，BFF 代理层从 token 中读
      return session;
    },
  },

  pages: {
    // 登录入口路径（C 端不再承载登录表单 UI，改为 Route Handler 自动 302 到 B 端登录页）
    // 见 src/app/auth/signin/route.ts
    signIn: "/auth/signin",
  },
});
