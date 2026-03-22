/**
 * 问卷详情页
 * 动态路由页面，根据问卷ID显示问卷内容并提供填写功能
 */
import PageWrapper from "@/app/PageWrapper";
import { getQuestionById } from "@/services/question";
import { getComponent } from "@/components";

/**
 * 问卷API响应数据类型
 */
type resDataType = {
  errno: number;              // 错误码，0表示成功
  data?: {
    _id: string;              // 问卷ID
    title: string;            // 问卷标题
    desc?: string;            // 问卷描述
    js?: string;              // 自定义JavaScript
    css?: string;             // 自定义CSS
    isPublished?: boolean;    // 是否发布
    isDeleted?: boolean;      // 是否删除
    componentList?: Array<any>; // 问卷组件列表
  };
  msg?: string;               // 错误信息
};

/**
 * 动态生成页面元数据
 * @param params 路由参数，包含问卷ID
 * @returns 页面元数据对象
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 获取问卷ID
  const { id: questionId } = await params;
  // 根据ID获取问卷数据
  const resData: resDataType = await getQuestionById(questionId);
  
  const { errno, data, msg = "" } = resData;
  
  // 数据错误处理
  if (errno !== 0) {
    return {
      title: `问卷 ${questionId} - 数据错误`,
      description: `数据错误：${msg}`,
    };
  }
  
  const { isDeleted, isPublished } = data || {};
  
  // 问卷已删除处理
  if (isDeleted) {
    return {
      title: `问卷 ${questionId} - 已删除`,
      description: `问卷已删除`,
    };
  }
  
  // 问卷未发布处理
  if (!isPublished) {
    return {
      title: `问卷 ${questionId} - 未发布`,
      description: `问卷未发布`,
    };
  }

  // 正常情况返回元数据
  return {
    title: `问卷 ${questionId} - 填写页面`,
    description: `请完成问卷 ${questionId} 的回答`,
  };
}

/**
 * 问卷详情页组件
 * @param params 路由参数，包含问卷ID
 * @returns 问卷填写页面
 */
export default async function Question({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 获取问卷ID
  const { id: questionId } = await params;

  // 根据ID获取问卷数据
  const resData: resDataType = await getQuestionById(questionId);

  const { errno, data, msg = "" } = resData;

  // 数据错误处理
  if (errno !== 0) {
    return (
      <PageWrapper>
        <h1>数据错误</h1>
        <p>{msg}</p>
      </PageWrapper>
    );
  }

  const { _id, isDeleted, isPublished, componentList } = data || {};

  // 问卷已删除处理
  if (isDeleted) {
    return (
      <PageWrapper>
        <h1>问卷已删除</h1>
        <p>{msg}</p>
      </PageWrapper>
    );
  }

  // 问卷未发布处理
  if (!isPublished) {
    return (
      <PageWrapper>
        <h1>问卷未发布</h1>
        <p>{msg}</p>
      </PageWrapper>
    );
  }

  // 渲染问卷组件列表
  const ComponentListElem = (
    <>
      {componentList?.map((c) => {
        // 根据组件类型获取对应的React组件
        const ComponentElem = getComponent(c);
        const { fe_id } = c;
        return (
          <div key={fe_id} className="mb-8 pb-8 border-b border-gray-100 last:border-b-0 last:pb-0 last:mb-0">
            {ComponentElem}
          </div>
        );
      })}
    </>
  );

  return (
    <PageWrapper>
      {/* 问卷表单，提交到API */}
      <form action="/api/answer" method="post" className="space-y-6">
        {/* 隐藏字段，传递问卷ID */}
        <input type="hidden" name="questionId" value={_id} />
        
        {/* 渲染问卷组件 */}
        {ComponentListElem}
        
        {/* 提交按钮 */}
        <div className="flex justify-center pt-4">
          <button 
            type="submit" 
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
          >
            提交问卷
          </button>
        </div>
      </form>
    </PageWrapper>
  );
}
