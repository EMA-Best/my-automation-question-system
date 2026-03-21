/**
 * @description: ajax服务（方法）封装
 * @description: Next.js（使用fetch）默认会缓存相同 URL 的请求（在 Server Component 中）
 */

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function getBackendBaseCandidates(): string[] {
  const fromEnv = [
    process.env.NEXT_PUBLIC_BACKEND_API_BASE,
    process.env.BACKEND_API_BASE,
  ].filter((v): v is string => typeof v === "string" && v.trim().length > 0);

  // 历史联调端口兼容：3005/3007
  const defaults = ["http://localhost:3005", "http://localhost:3007"];

  return Array.from(
    new Set([...fromEnv.map((v) => normalizeBaseUrl(v.trim())), ...defaults]),
  );
}

async function fetchWithBaseFallback(url: string, init?: RequestInit) {
  const bases = getBackendBaseCandidates();
  let lastError: unknown = null;

  for (const base of bases) {
    try {
      return await fetch(`${base}${url}`, {
        cache: "no-store",
        ...init,
      });
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("后端服务不可用");
}

export async function GET(url: string) {
  const res = await fetchWithBaseFallback(url);
  const data = await res.json();
  return data;
}

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
