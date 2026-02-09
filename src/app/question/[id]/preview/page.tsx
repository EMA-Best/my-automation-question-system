import { getQuestionPreview } from "@/services/question";
import { getComponent } from "@/components";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PreviewPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PreviewPageProps) {
  const { id } = await params;
  try {
    const res = await getQuestionPreview(id);
    return {
      title: `${res.data.title} - 问卷预览`,
    };
  } catch {
    return { title: "问卷预览" };
  }
}

interface PreviewQuestion {
  id: string;
  title: string;
  description: string;
  featured?: boolean;
  pinned?: boolean;
  questionCount: number;
  answerCount: number;
  createdAt?: string;
  components?: unknown[];
  componentList?: unknown[];
  desc?: string;
  _id?: string;
  publishedAt?: string;
  updatedAt?: string;
}

function normalizeQuestion(raw: PreviewQuestion): {
  id: string;
  title: string;
  description: string;
  featured?: boolean;
  pinned?: boolean;
  questionCount: number;
  answerCount: number;
  componentList: unknown[];
} {
  const id = raw.id || raw._id || "";
  const description = raw.description || raw.desc || "";
  const componentList =
    raw.componentList || (raw.components ? (raw.components as unknown[]) : []);

  return {
    id,
    title: raw.title,
    description,
    featured: raw.featured,
    pinned: raw.pinned,
    questionCount: raw.questionCount,
    answerCount: raw.answerCount,
    componentList,
  };
}

function getRawComponentType(comp: unknown): string | undefined {
  if (typeof comp !== "object" || comp === null) return undefined;
  const t = (comp as Record<string, unknown>).type;
  return typeof t === "string" ? t : undefined;
}

function getRawComponentFeId(comp: unknown): string | undefined {
  if (typeof comp !== "object" || comp === null) return undefined;
  const feId = (comp as Record<string, unknown>).fe_id;
  return typeof feId === "string" ? feId : undefined;
}

function getRawComponentProps(
  comp: unknown,
): Record<string, unknown> | undefined {
  if (typeof comp !== "object" || comp === null) return undefined;
  const props = (comp as Record<string, unknown>).props;
  if (typeof props !== "object" || props === null) return undefined;
  return props as Record<string, unknown>;
}

function isDuplicatePreviewTitle(comp: unknown, title: string): boolean {
  if (getRawComponentType(comp) !== "questionTitle") return false;
  const props = getRawComponentProps(comp);
  if (!props) return false;
  const text = props.text;
  const level = props.level;
  if (typeof text !== "string") return false;
  const normalizedText = text.trim();
  const normalizedTitle = title.trim();
  if (normalizedText !== normalizedTitle) return false;
  // 只移除大标题（通常是 level=1）避免误删正文小标题
  if (typeof level === "number") return level === 1;
  return true;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  let question: PreviewQuestion | null = null;
  let hasError = false;

  try {
    const res = await getQuestionPreview(id);
    question = (res.data as PreviewQuestion) || null;
  } catch (error) {
    console.error("获取问卷预览失败:", error);
    hasError = true;
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            获取问卷信息失败
          </h1>
          <p className="text-gray-600 text-lg mb-6">
            请检查问卷ID是否正确，或问卷可能已被删除
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 text-blue-600 hover:text-blue-800 font-medium border border-blue-600 rounded-lg hover:bg-blue-50 transition-all"
          >
            ← 返回首页
          </Link>
        </div>
      </div>
    );
  }

  if (!question) {
    notFound();
  }

  const q = normalizeQuestion(question);
  const renderComponentList = q.componentList.filter(
    (c) =>
      getRawComponentType(c) !== "questionInfo" &&
      !isDuplicatePreviewTitle(c, q.title),
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium"
        >
          ← 返回首页
        </Link>

        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h1 className="text-3xl font-bold text-gray-800">
                {question.title}
              </h1>
              {question.pinned && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 whitespace-nowrap">
                  🔝 置顶
                </span>
              )}
              {question.featured && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 whitespace-nowrap">
                  ⭐ 推荐
                </span>
              )}
            </div>
            <p className="text-gray-600 text-lg">{q.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {question.questionCount}
              </div>
              <div className="text-sm text-gray-600">道题目</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {question.answerCount}
              </div>
              <div className="text-sm text-gray-600">人已填写</div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡
              这是问卷预览页面，可以查看问卷内容但无法提交答卷。如需填写此问卷，请滚动到页面底部点击“立即填写”。
            </p>
          </div>

          <div className="mt-10 pt-8 border-t border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-6">
              问卷内容预览
            </h2>

            {renderComponentList.length > 0 ? (
              <div className="space-y-6">
                {renderComponentList.map((rawComp, index) => {
                  const component = rawComp as Parameters<
                    typeof getComponent
                  >[0];
                  const elem = getComponent(component);
                  if (!elem) return null;

                  return (
                    <div
                      key={getRawComponentFeId(rawComp) || index}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="pointer-events-none select-none opacity-95">
                        {elem}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">问卷暂无内容</p>
            )}
          </div>

          <div className="mt-10 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
              <p className="text-sm text-gray-600">
                预览模式不可提交，如需参与填写请点击右侧按钮
              </p>
              <Link
                href={`/question/${q.id}`}
                className="w-full sm:w-auto px-10 py-3 bg-linear-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:shadow-lg transition-all text-center"
              >
                立即填写
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
