/**
 * @description: ajax服务（方法）封装
 * @description: Next.js（使用fetch）默认会缓存相同 URL 的请求（在 Server Component 中）
 */

// const HOST = "http://localhost:3001"; // Mock的host
const HOST = "http://localhost:3005"; // nest服务器

export async function GET(url: string) {
  const res = await fetch(`${HOST}${url}`);
  const data = await res.json();
  return data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(url: string, body: any) {
  const res = await fetch(`${HOST}${url}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data;
}
