/**
 * @file templates/page.tsx
 * @description 模板列表页（公开，无需登录即可浏览）
 *
 * 设计说明：
 *  - 页面通过后端真实模板接口渲染，不再使用静态写死数据。
 *  - 卡片预览优先使用模板详情 componentList，按真实题型与真实选项渲染。
 *  - “使用此模板”按鈕晢 UseTemplateButton，连接真实 SSO 登录流程。
 *  - 顶部显示 TopBar，展示登录状态。
 */
import type { Metadata } from "next";
import Link from "next/link";
import TopBar from "@/components/TopBar";
import { getTemplateDetail, getTemplateList } from "@/services/template";
import type { TemplateDetail, TemplateListItem } from "@/types/template";
// "使用此模板"按鈕（Client Component）：负责调用 BFF 代理、处理 401 跳转登录
import UseTemplateButton from "./_components/UseTemplateButton";

export const metadata: Metadata = {
  title: "问卷模板 - 选择模板",
  description: "浏览并选择一个问卷模板，快速开始创建问卷",
};

type TemplateQuestion = {
  type:
    | "info"
    | "title"
    | "paragraph"
    | "input"
    | "textarea"
    | "radio"
    | "checkbox";
  label: string;
  desc?: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
};

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * 从 props.options 中提取真实选项文案。
 * 兼容形态：[{ text: '男' }, { label: '女' }, '未知']。
 */
function getOptionTexts(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (!item || typeof item !== "object") return "";
      const record = item as Record<string, unknown>;
      return (
        getString(record.text) ||
        getString(record.label) ||
        getString(record.value)
      );
    })
    .filter(Boolean)
    .slice(0, 4);
}

/**
 * 将模板详情里的真实组件，映射为卡片预览的简化题型。
 *
 * 目标：
 * - 按“真实 componentList 顺序”展示前五个组件
 * - 无法识别的组件类型自动跳过
 */
function mapRealComponentToPreviewQuestion(
  component: TemplateDetail["componentList"][number],
): TemplateQuestion | null {
  // 隐藏组件不参与卡片预览，避免与编辑页实际可见内容不一致
  if (component.isHidden) return null;

  const rawType = component.type;
  const rawTitle = getString(component.title) || "未命名题目";
  const props = component.props ?? {};

  // 题目文案在不同组件里字段不同，统一做多字段兜底
  const propsTitle =
    getString(props.title) ||
    getString(props.text) ||
    getString(props.label) ||
    getString(props.name);
  const label = propsTitle || rawTitle;

  // 部分组件支持 required
  const required = Boolean(props.required);

  if (rawType === "questionInfo") {
    const infoTitle = getString(props.title) || label;
    const infoDesc = getString(props.desc) || getString(component.title);
    return { type: "info", label: infoTitle, desc: infoDesc };
  }

  if (rawType === "questionTitle") {
    return { type: "title", label, required };
  }

  if (rawType === "questionParagraph") {
    const paragraphText =
      getString(props.text) || getString(props.desc) || label;
    return { type: "paragraph", label: paragraphText };
  }

  if (rawType === "questionInput") {
    return {
      type: "input",
      label,
      required,
      placeholder: getString(props.placeholder) || "请输入...",
    };
  }

  if (rawType === "questionTextarea") {
    return {
      type: "textarea",
      label,
      required,
      placeholder: getString(props.placeholder) || "请输入...",
    };
  }

  if (rawType === "questionRadio") {
    return {
      type: "radio",
      label,
      required,
      options: getOptionTexts(props.options),
    };
  }

  if (rawType === "questionCheckbox") {
    return {
      type: "checkbox",
      label,
      required,
      options: getOptionTexts(props.options),
    };
  }

  return null;
}

const SUMMARY_TYPE_TO_PREVIEW_TYPE: Record<string, TemplateQuestion["type"]> = {
  questionTitle: "title",
  questionParagraph: "paragraph",
  questionInfo: "paragraph",
  questionInput: "input",
  questionTextarea: "textarea",
  questionRadio: "radio",
  questionCheckbox: "checkbox",
};

const SUMMARY_TYPE_TO_LABEL: Record<string, string> = {
  questionTitle: "标题",
  questionParagraph: "说明段落",
  questionInfo: "问卷信息",
  questionInput: "填空题",
  questionTextarea: "多行填空",
  questionRadio: "单选题",
  questionCheckbox: "多选题",
};

/**
 * 将列表接口中的 componentSummary 转成预览题型（最多 5 项）。
 *
 * 优势：
 * - 无需额外拉取每个模板详情，避免 N+1 请求
 * - 页面首屏更稳，后端临时抖动时失败面更小
 */
function summaryToPreviewQuestions(
  summary?: Array<{ type: string; count: number }>,
): TemplateQuestion[] {
  if (!summary || summary.length === 0) return [];

  const result: TemplateQuestion[] = [];
  for (const item of summary) {
    const previewType = SUMMARY_TYPE_TO_PREVIEW_TYPE[item.type];
    if (!previewType) continue;

    const label = SUMMARY_TYPE_TO_LABEL[item.type] ?? item.type;
    const repeat = Number.isFinite(item.count) ? Math.max(1, item.count) : 1;

    for (let i = 0; i < repeat; i += 1) {
      if (result.length >= 5) return result;
      result.push({ type: previewType, label });
    }
  }

  return result;
}

function requiredLabel(label: string, required?: boolean) {
  return required ? `${label} *` : label;
}

function TemplatePreview({ questions }: { questions: TemplateQuestion[] }) {
  // 按需求：每个模板卡片展示前 5 项组件
  const preview = questions.slice(0, 5);

  return (
    <div className="space-y-4">
      {preview.map((q, idx) => {
        switch (q.type) {
          case "info":
            return (
              <div
                key={`${q.type}-${idx}`}
                className="px-3 py-4 rounded-lg bg-white text-center space-y-1"
              >
                <h3 className="text-lg font-bold text-gray-900">{q.label}</h3>
                {q.desc ? (
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                    {q.desc}
                  </p>
                ) : null}
              </div>
            );
          case "title":
            return (
              <h3
                key={`${q.type}-${idx}`}
                className="text-base font-semibold text-gray-900 leading-snug"
              >
                {q.label}
              </h3>
            );
          case "paragraph":
            return (
              <p
                key={`${q.type}-${idx}`}
                className="text-xs text-gray-600 leading-relaxed"
              >
                {q.label}
              </p>
            );
          case "input":
            return (
              <div key={`${q.type}-${idx}`} className="space-y-2">
                <div className="text-xs font-medium text-gray-700">
                  {requiredLabel(q.label, q.required)}
                </div>
                <input
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400"
                  placeholder={q.placeholder || "请输入..."}
                />
              </div>
            );
          case "textarea":
            return (
              <div key={`${q.type}-${idx}`} className="space-y-2">
                <div className="text-xs font-medium text-gray-700">
                  {requiredLabel(q.label, q.required)}
                </div>
                <textarea
                  disabled
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 resize-none"
                  placeholder={q.placeholder || "请填写..."}
                />
              </div>
            );
          case "radio": {
            // 单选按模板真实 options 渲染，缺失时给最小兜底
            const options =
              q.options && q.options.length > 0
                ? q.options.slice(0, 4)
                : ["选项1", "选项2", "选项3"];
            return (
              <div key={`${q.type}-${idx}`} className="space-y-2">
                <div className="text-xs font-medium text-gray-700">
                  {requiredLabel(q.label, q.required)}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {options.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-2 text-xs text-gray-600"
                    >
                      <input
                        disabled
                        type="radio"
                        className="w-3.5 h-3.5 border-gray-300"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          }
          case "checkbox": {
            // 多选按模板真实 options 渲染，缺失时给最小兜底
            const options =
              q.options && q.options.length > 0
                ? q.options.slice(0, 4)
                : ["选项1", "选项2", "选项3"];
            return (
              <div key={`${q.type}-${idx}`} className="space-y-2">
                <div className="text-xs font-medium text-gray-700">
                  {requiredLabel(q.label, q.required)}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {options.map((opt) => (
                    <label
                      key={opt}
                      className="flex items-center gap-2 text-xs text-gray-600"
                    >
                      <input
                        disabled
                        type="checkbox"
                        className="w-3.5 h-3.5 border-gray-300 rounded"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          }
          default:
            return null;
        }
      })}
    </div>
  );
}

type TemplateCardItem = {
  id: string;
  questions: TemplateQuestion[];
};

/**
 * 构建模板卡片数据：
 * - 先拉公开模板列表
 * - 再并行拉取每个模板详情，用真实 componentList 生成预览（前 5 项）
 * - 若某个详情拉取失败，回退到列表 summary 预览
 * - 请求失败时返回空数组，防止页面在 Server Component 阶段直接崩溃
 */
async function getTemplateCards(): Promise<TemplateCardItem[]> {
  try {
    const listRes = await getTemplateList({ page: 1, pageSize: 20 });

    const detailById = new Map<string, TemplateDetail>();

    // 并行请求详情：使用 allSettled，确保单个模板失败不影响整体渲染
    const detailResults = await Promise.allSettled(
      listRes.list.map(async (tpl) => {
        const detail = await getTemplateDetail(tpl.id);
        return { id: tpl.id, detail };
      }),
    );

    detailResults.forEach((item) => {
      if (item.status !== "fulfilled") return;
      detailById.set(item.value.id, item.value.detail);
    });

    return listRes.list.map((tpl: TemplateListItem) => {
      const detail = detailById.get(tpl.id);

      // 优先使用真实 componentList 的前五个组件
      if (detail?.componentList?.length) {
        const fromRealComponents = detail.componentList
          .map(mapRealComponentToPreviewQuestion)
          .filter((q): q is TemplateQuestion => Boolean(q))
          .slice(0, 5);

        if (fromRealComponents.length > 0) {
          return {
            id: tpl.id,
            questions: fromRealComponents,
          };
        }
      }

      // 兜底：详情缺失或无法映射时，使用列表 summary
      return {
        id: tpl.id,
        questions: summaryToPreviewQuestions(tpl.componentSummary),
      };
    });
  } catch (error) {
    console.error("[templates] 获取模板列表失败:", error);
    return [];
  }
}

export default async function TemplatesPage() {
  const templates = await getTemplateCards();

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50">
      <TopBar />
      <div className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* 页头区域 - 美化版 */}
          <div className="flex items-start justify-between gap-6 mb-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Link
                  href="/"
                  className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 font-medium"
                >
                  <svg
                    className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  返回首页
                </Link>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-linear-to-r from-blue-50 to-purple-50 border border-blue-100 text-sm font-medium text-blue-700">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                    />
                  </svg>
                  {templates.length} 个精选模板
                </span>
              </div>
              <h1 className="text-4xl font-bold bg-linear-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-3">
                问卷模板库
              </h1>
              <p className="text-gray-600 text-base leading-relaxed max-w-2xl">
                每个模板卡片展示实际问卷结构。鼠标悬停在卡片上即可看到「使用此模板」按钮，一键开始编辑。
              </p>
            </div>

            <div className="hidden md:block">
              <div className="bg-linear-to-br from-white to-blue-50/50 backdrop-blur border-2 border-blue-100 rounded-2xl px-6 py-5 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-4 h-4 text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="text-sm font-semibold text-blue-700">
                    小提示
                  </div>
                </div>
                <div className="text-gray-900 font-medium text-base">
                  先选模板，再做个性化编辑
                </div>
              </div>
            </div>
          </div>

          {/* 模板网格：大屏一行 5 个，超出自动换行 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {templates.map((tpl) => {
              return (
                <div
                  key={tpl.id}
                  className="group relative flex flex-col bg-white/90 backdrop-blur border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                >
                  {/* Hover overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-blue-50/85 to-purple-50/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* 卡片直接展示模板预览，不再额外套一层结构容器 */}
                  <div className="relative z-10 p-5 flex-1">
                    <div className="pointer-events-none select-none transition-all duration-300 group-hover:opacity-20 group-hover:blur-[1px]">
                      <TemplatePreview
                        questions={
                          tpl.questions.length > 0
                            ? tpl.questions
                            : [
                                {
                                  type: "paragraph",
                                  label: "该模板暂无可预览题目",
                                },
                              ]
                        }
                      />
                    </div>
                  </div>

                  {/*
                   * Hover 覆盖层上的“使用此模板”按鈕
                   * UseTemplateButton 是 Client Component，负责：
                   *  1. 调用 POST /api/proxy/templates/:id/use（BFF 代理）
                   *  2. 成功：跳转到 B 端编辑页
                   *  3. 401（未登录）：跳转到 /auth/signin + callbackUrl，登录后自动回来继续执行
                   */}
                  <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="pointer-events-auto">
                      <UseTemplateButton templateId={tpl.id} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 底部说明 */}
          <div className="mt-10 text-center text-sm text-gray-500">
            没找到合适的？你也可以从任意模板开始，再按需增删题目。
          </div>
        </div>
      </div>
    </div>
  );
}
