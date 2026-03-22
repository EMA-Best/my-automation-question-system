/**
 * AJAX 服务封装
 * 基于 fetch API，支持多后端地址 fallback
 * 
 * Next.js（使用fetch）默认会缓存相同 URL 的请求（在 Server Component 中）
 */

/**
 * 规范化基础 URL，移除末尾的斜杠
 * @param value 基础 URL
 * @returns 规范化后的 URL
 */
function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

/**
 * 获取后端 API 基础地址候选列表
 * @returns 基础地址数组
 */
function getBackendBaseCandidates(): string[] {
  // 从环境变量获取
  const fromEnv = [
    process.env.NEXT_PUBLIC_BACKEND_API_BASE,
    process.env.BACKEND_API_BASE,
  ].filter((v): v is string => typeof v === "string" && v.trim().length > 0);

  // 历史联调端口兼容：3005/3007
  const defaults = ["http://localhost:3005", "http://localhost:3007"];

  // 去重并返回
  return Array.from(
    new Set([...fromEnv.map((v) => normalizeBaseUrl(v.trim())), ...defaults]),
  );
}

/**
 * 带基础地址 fallback 的 fetch 方法
 * @param url API 路径
 * @param init 请求配置
 * @returns Response 对象
 * @throws Error 当所有后端地址都不可用时
 */
async function fetchWithBaseFallback(url: string, init?: RequestInit) {
  const bases = getBackendBaseCandidates();
  let lastError: unknown = null;

  // 尝试所有候选地址
  for (const base of bases) {
    try {
      return await fetch(`${base}${url}`, {
        cache: "no-store", // 禁用缓存
        ...init,
      });
    } catch (error) {
      lastError = error;
    }
  }

  // 所有地址都失败
  throw lastError ?? new Error("后端服务不可用");
}

/**
 * 发送 GET 请求
 * @param url API 路径
 * @returns 响应数据
 */
export async function GET(url: string) {
  const res = await fetchWithBaseFallback(url);
  const data = await res.json();
  return data;
}

/**
 * 发送 POST 请求
 * @param url API 路径
 * @param body 请求体
 * @returns 响应数据
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(url: string, body: any) {
  const res = await fetchWithBaseFallback(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data;
}
