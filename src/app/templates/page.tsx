/**
 * @file templates/page.tsx
 * @description 模板列表页（公开，无需登录即可浏览）
 *
 * 设计说明：
 *  - 页面内的预览组件使用静态模拟数据展示结构（内容仅作示意）。
 *  - “使用此模板”按鈕晢 UseTemplateButton，连接真实 SSO 登录流程。
 *  - 顶部显示 TopBar，展示登录状态。
 */
import type { Metadata } from "next";
import Link from "next/link";
import TopBar from "@/components/TopBar";
// "使用此模板"按鈕（Client Component）：负责调用 BFF 代理、处理 401 跳转登录
import UseTemplateButton from "./_components/UseTemplateButton";

export const metadata: Metadata = {
  title: "问卷模板 - 选择模板",
  description: "浏览并选择一个问卷模板，快速开始创建问卷",
};

type TemplateQuestion = {
  type: "title" | "paragraph" | "input" | "textarea" | "radio" | "checkbox";
  label: string;
  required?: boolean;
};

type QuestionnaireTemplate = {
  id: string;
  name: string;
  description: string;
  tags: string[];
  questions: TemplateQuestion[];
};

const TYPE_LABEL: Record<TemplateQuestion["type"], string> = {
  title: "标题",
  paragraph: "段落",
  input: "输入",
  textarea: "多行输入",
  radio: "单选",
  checkbox: "多选",
};

const templates: QuestionnaireTemplate[] = [
  {
    id: "event-feedback",
    name: "活动反馈问卷",
    description:
      "适用于线下/线上活动后的满意度收集，包含满意度、亮点、建议与回访意愿。",
    tags: ["通用", "满意度", "活动"],
    questions: [
      { type: "title", label: "活动反馈" },
      { type: "paragraph", label: "感谢参与，请用 2 分钟完成反馈。" },
      { type: "radio", label: "整体满意度", required: true },
      { type: "checkbox", label: "你最喜欢的部分" },
      { type: "textarea", label: "还有哪些建议？" },
      { type: "radio", label: "是否愿意被回访" },
    ],
  },
  {
    id: "job-application",
    name: "岗位应聘登记",
    description:
      "用于招聘收集候选人基础信息与求职意向，结构清晰，便于后续筛选与跟进。",
    tags: ["招聘", "信息收集"],
    questions: [
      { type: "title", label: "应聘信息登记" },
      { type: "input", label: "姓名", required: true },
      { type: "input", label: "手机号", required: true },
      { type: "input", label: "邮箱" },
      { type: "radio", label: "期望岗位" },
      { type: "textarea", label: "自我介绍/项目亮点" },
    ],
  },
  {
    id: "course-evaluation",
    name: "课程评价问卷",
    description:
      "适用于培训/课程结束后的教学质量评估，覆盖内容难度、讲师表现与改进建议。",
    tags: ["教育", "评价"],
    questions: [
      { type: "title", label: "课程评价" },
      { type: "radio", label: "内容难度是否合适", required: true },
      { type: "radio", label: "讲解是否清晰", required: true },
      { type: "checkbox", label: "最有帮助的部分" },
      { type: "textarea", label: "你希望增加哪些内容？" },
    ],
  },
  {
    id: "product-research",
    name: "产品调研问卷",
    description:
      "用于探索用户画像与需求优先级，包含使用频率、痛点与功能偏好等关键问题。",
    tags: ["调研", "产品"],
    questions: [
      { type: "title", label: "产品调研" },
      { type: "radio", label: "使用频率" },
      { type: "checkbox", label: "目前的主要痛点" },
      { type: "radio", label: "最希望优先解决的问题" },
      { type: "textarea", label: "对未来功能有什么期待？" },
    ],
  },
  {
    id: "customer-satisfaction",
    name: "客户满意度（CSAT）",
    description:
      "适用于服务交付后快速测量满意度与改进方向，问题少、回收快、转化高。",
    tags: ["服务", "满意度"],
    questions: [
      { type: "title", label: "满意度调查" },
      { type: "radio", label: "本次体验满意吗？", required: true },
      { type: "textarea", label: "可以说说原因吗？" },
      { type: "radio", label: "是否愿意推荐给朋友" },
    ],
  },
  {
    id: "new-employee",
    name: "新员工入职信息",
    description:
      "帮助 HR 快速收集入职必需信息与设备需求，减少反复沟通，提高 onboarding 效率。",
    tags: ["HR", "入职"],
    questions: [
      { type: "title", label: "入职信息" },
      { type: "input", label: "姓名", required: true },
      { type: "input", label: "入职日期", required: true },
      { type: "checkbox", label: "需要的设备" },
      { type: "textarea", label: "其他备注" },
    ],
  },
  {
    id: "meeting-registration",
    name: "会议报名表",
    description: "适用于会议/沙龙报名，包含参会信息、饮食偏好与会前问题收集。",
    tags: ["报名", "会议"],
    questions: [
      { type: "title", label: "会议报名" },
      { type: "input", label: "姓名", required: true },
      { type: "input", label: "公司/组织" },
      { type: "radio", label: "参会方式（线下/线上）" },
      { type: "checkbox", label: "饮食偏好" },
      { type: "textarea", label: "你希望现场讨论的问题" },
    ],
  },
  {
    id: "after-sales",
    name: "售后问题收集",
    description:
      "用于售后工单前置收集，帮助快速定位问题与复现路径，提升解决效率。",
    tags: ["售后", "问题"],
    questions: [
      { type: "title", label: "售后问题反馈" },
      { type: "input", label: "订单号", required: true },
      { type: "radio", label: "问题类型", required: true },
      { type: "textarea", label: "问题描述（尽量详细）", required: true },
      { type: "checkbox", label: "期望的处理方式" },
    ],
  },
  {
    id: "nps-survey",
    name: "NPS 推荐度调查",
    description:
      "经典 NPS 模板：推荐度 + 原因追问 + 改进建议，适合做长期追踪。",
    tags: ["NPS", "增长"],
    questions: [
      { type: "title", label: "推荐度调查" },
      { type: "radio", label: "你有多大可能推荐给朋友？", required: true },
      { type: "textarea", label: "给出这个分数的原因" },
      { type: "textarea", label: "我们可以改进的一件事" },
    ],
  },
  {
    id: "website-ux",
    name: "网站体验（UX）反馈",
    description:
      "针对网站可用性与信息架构进行快速回访，适合版本上线后收集真实体验。",
    tags: ["UX", "网站"],
    questions: [
      { type: "title", label: "网站体验反馈" },
      { type: "radio", label: "是否容易找到需要的信息？", required: true },
      { type: "checkbox", label: "遇到的问题" },
      { type: "textarea", label: "你最想优化的一个地方" },
      { type: "input", label: "（可选）联系方式" },
    ],
  },
];

function requiredLabel(label: string, required?: boolean) {
  return required ? `${label} *` : label;
}

function getStructureSummary(questions: TemplateQuestion[]) {
  const counts = questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1;
    return acc;
  }, {});

  const order: TemplateQuestion["type"][] = [
    "title",
    "paragraph",
    "input",
    "textarea",
    "radio",
    "checkbox",
  ];

  return order
    .filter((t) => counts[t])
    .map((t) => ({ type: t, label: TYPE_LABEL[t], count: counts[t] }));
}

function TemplatePreview({ questions }: { questions: TemplateQuestion[] }) {
  const preview = questions.slice(0, 6);

  return (
    <div className="space-y-4">
      {preview.map((q, idx) => {
        switch (q.type) {
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
                  placeholder="请输入..."
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
                  placeholder="请填写..."
                />
              </div>
            );
          case "radio": {
            const options = ["非常满意", "一般", "不满意"].slice(0, 3);
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
            const options = ["选项 A", "选项 B", "选项 C"].slice(0, 3);
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

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50">
      <TopBar />
      <div className="py-10 px-4">
        <div className="max-w-7xl mx-auto">
          {/* 页头区域 */}
          <div className="flex items-start justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href="/"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:shadow-sm transition-shadow"
                >
                  返回首页
                </Link>
                <span className="text-sm text-gray-500">10 个精选模板</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">问卷模板库</h1>
              <p className="text-gray-600 mt-2 max-w-3xl">
                每个模板卡片会展示结构与描述。将鼠标悬浮到卡片上，即可看到“选择此模板”按钮。
              </p>
            </div>

            <div className="hidden md:block">
              <div className="bg-white/80 backdrop-blur border border-gray-200 rounded-2xl px-5 py-4 shadow-sm">
                <div className="text-sm text-gray-500">小提示</div>
                <div className="text-gray-900 font-medium">
                  先选模板，再做个性化编辑
                </div>
              </div>
            </div>
          </div>

          {/* 模板网格：大屏一行 5 个，超出自动换行 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {templates.map((tpl) => {
              const summary = getStructureSummary(tpl.questions);

              return (
                <div
                  key={tpl.id}
                  className="group relative flex flex-col bg-white/90 backdrop-blur border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                >
                  {/* Hover overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-blue-50/85 to-purple-50/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* 上：问卷结构（按填写页结构预览） */}
                  <div className="relative z-10 p-5 flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-semibold text-gray-700">
                        问卷结构
                      </div>
                      <div className="text-[11px] text-gray-500">
                        预览前 6 项
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="pointer-events-none select-none transition-all duration-300 group-hover:opacity-20 group-hover:blur-[1px]">
                        <TemplatePreview questions={tpl.questions} />
                      </div>
                    </div>
                  </div>

                  {/* 下：描述信息 */}
                  <div className="relative z-10 border-t border-gray-200 bg-white/75 backdrop-blur p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 leading-snug">
                          {tpl.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                          {tpl.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {tpl.tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4">
                      <div className="text-xs font-semibold text-gray-700 mb-2">
                        结构概览
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {summary.map((s) => (
                          <span
                            key={s.type}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-blue-50 text-blue-700 border border-blue-100"
                          >
                            <span>{s.label}</span>
                            <span className="text-blue-600">×{s.count}</span>
                          </span>
                        ))}
                      </div>
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
                    <div className="w-full px-6">
                      {/* pointer-events-auto 让按鈕在 pointer-events-none 遗传下仍可点击 */}
                      <div className="pointer-events-auto flex flex-col items-stretch gap-2">
                        <UseTemplateButton templateId={tpl.id} />
                      </div>
                      <div className="mt-2 text-[11px] text-gray-600 text-center">
                        登录后自动克隆模板到我的问卷
                      </div>
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
