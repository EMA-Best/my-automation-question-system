/**
 * @file template.ts
 * @description 模板相关 API Service 层
 *
 * 分两类请求：
 *  1. 公开接口（无需登录）：直接请求后端 BACKEND_API_BASE。
 *     如 GET /api/templates、GET /api/templates/:id
 *  2. 受保护接口（需登录）：统一走 C 端 BFF 代理 /api/proxy/**，
 *     由服务端自动注入 Authorization Bearer Token，浏览器永远看不到 access_token。
 *     如 POST /api/proxy/templates/:id/use
 */

import type {
  TemplateDetail,
  TemplateListQuery,
  TemplateListRes,
  UseTemplateRes,
} from "@/types/template";

// -------------------------------------------------------
// 工具：服务端（Server Component）直接请求后端基础 URL
// -------------------------------------------------------
const BACKEND_BASE = process.env.BACKEND_API_BASE ?? process.env.NEXT_PUBLIC_BACKEND_API_BASE;

if (!BACKEND_BASE) {
  throw new Error("请在环境变量中配置 BACKEND_API_BASE 或 NEXT_PUBLIC_BACKEND_API_BASE");
}

/**
 * 处理后端响应，统一判断 errno
 * @param res  fetch 返回的 Response 对象
 * @returns    解析后的 data 字段
 * @throws     接口错误或 HTTP 异常
 */
async function handleRes<T>(res: Response): Promise<T> {
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  const json = await res.json();
  if (json.errno !== 0) {
    throw new Error(json.msg ?? "接口返回错误");
  }
  return json.data as T;
}

// =====================================================
// 公开接口（Server Component 中直接调用，无需登录）
// =====================================================

/**
 * 获取已发布的模板列表
 * 对应接口：GET /api/templates
 * 权限：无需登录
 *
 * @param query  可选过滤参数：page / pageSize / keyword / category / tag
 * @returns      分页模板列表 TemplateListRes
 *
 * @example
 * const result = await getTemplateList({ page: 1, pageSize: 12 });
 * console.log(result.list); // TemplateListItem[]
 */
export async function getTemplateList(
  query: TemplateListQuery = {},
): Promise<TemplateListRes> {
  // 将查询参数序列化为 URL query string，过滤掉 undefined 值
  const params = new URLSearchParams(
    Object.entries(query)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, String(v)]),
  ).toString();

  const url = `${BACKEND_BASE}/api/templates${params ? `?${params}` : ""}`;

  let res: Response;
  try {
    res = await fetch(url, {
      // Next.js默认对 Server Component 的 fetch 做缓存；
      // 模板列表更新频率低，缓存 60 秒，兼顾性能与实时性
      next: { revalidate: 60 },
    });
  } catch (error) {
    // 网络层错误（例如后端未启动、DNS 不可达）会在这里抛出，
    // 提供更可读的上下文，便于快速定位配置或联调问题。
    throw new Error(
      `[template] fetch list failed: ${url}; reason: ${(error as Error)?.message ?? "unknown"}`,
    );
  }

  return handleRes<TemplateListRes>(res);
}

/**
 * 获取指定模板的详情（含完整 componentList，用于预览渲染）
 * 对应接口：GET /api/templates/:id
 * 权限：无需登录
 *
 * @param id  模板 ID
 * @returns   TemplateDetail（包含 componentList）
 */
export async function getTemplateDetail(id: string): Promise<TemplateDetail> {
  const url = `${BACKEND_BASE}/api/templates/${id}`;

  const res = await fetch(url, {
    // 模板详情更新频率较低，缓存 60 秒
    next: { revalidate: 60 },
  });

  return handleRes<TemplateDetail>(res);
}

// =====================================================
// 受保护接口（通过 BFF 代理，服务端注入 Bearer Token）
// =====================================================

/**
 * 使用模板创建一份属于当前用户的新问卷（后端执行克隆）
 * 对应接口（BFF 代理）：POST /api/proxy/templates/:id/use
 * 权限：需要登录（BFF 层校验 Session + 注入 Bearer Token）
 *
 * 调用方说明：
 *  - 此函数适合在 Client Component 中调用（浏览器侧 fetch /api/proxy）。
 *  - 成功：返回 { questionId }，前端跳转 B 端编辑页。
 *  - 失败 401：表示未登录，前端应重定向到登录页。
 *  - 失败 403：模板不可用（下线/无权限），给用户友好提示。
 *
 * @param templateId  模板 ID
 * @returns           { questionId: string }
 * @throws            HTTP 异常（401/403/500 等）
 *
 * @example — 在 Client Component 中
 * const { questionId } = await useTemplate('tpl_1');
 * window.location.href = `${B_APP_ORIGIN}/question/edit/${questionId}`;
 */
export async function useTemplate(templateId: string): Promise<UseTemplateRes> {
  // 注意：这里请求的是 C 端自身的 BFF 代理路由，不是后端直接路由。
  // BFF 代理会：① 校验 Session，② 从服务端 JWT 取出 access_token，
  //            ③ 携带 Authorization: Bearer <token> 转发给后端。
  const res = await fetch(`/api/proxy/templates/${templateId}/use`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (res.status === 401) {
    // 未登录，抛出特殊错误，让调用方处理重定向
    const err = new Error("UNAUTHORIZED") as Error & { status: number };
    err.status = 401;
    throw err;
  }

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    const err = new Error(
      (json as { msg?: string }).msg ?? `请求失败（${res.status}）`,
    ) as Error & { status: number };
    err.status = res.status;
    throw err;
  }

  const json = await res.json();
  return json.data as UseTemplateRes;
}
