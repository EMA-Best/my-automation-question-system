// 临时引入测试

import PageWrapper from "@/app/PageWrapper";

import { getQuestionById } from "@/services/question";
import { getComponent } from "@/components";

type resDataType = {
  errno: number;
  data?: {
    _id: string;
    title: string;
    desc?: string;
    js?: string;
    css?: string;
    isPublished?: boolean;
    isDeleted?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    componentList?: Array<any>;
  };
  msg?: string;
};

// 动态生成页面的 metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 你可以根据 id 查询数据库获取真实标题
  const { id: questionId } = await params;
  // 根据 ID 获取问卷数据
  const resData: resDataType = await getQuestionById(questionId);
  // console.log("resData: ", resData);
  
  const { errno, data, msg = "" } = resData;
  // 数据错误处理
  if (errno !== 0) {
    return {
      title: `问卷 ${questionId} - 数据错误`,
      description: `数据错误：${msg}`,
    };
  }
  const { isDeleted, isPublished } = data || {};
  // 判断问卷是否删除
  if (isDeleted) {
    return {
      title: `问卷 ${questionId} - 已删除`,
      description: `问卷已删除`,
    };
  }
  // 判断问卷是否发布
  if (!isPublished) {
    return {
      title: `问卷 ${questionId} - 未发布`,
      description: `问卷未发布`,
    };
  }

  // 正常情况返回
  return {
    title: `问卷 ${questionId} - 填写页面`,
    description: `请完成问卷 ${questionId} 的回答`,
  };
}

export default async function Question({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 取得问卷 ID
  const { id: questionId } = await params;
  // console.log("questionId: ", questionId);

  // 根据 ID 获取问卷数据
  const resData: resDataType = await getQuestionById(questionId);
  // console.log("resData:", resData);

  const { errno, data, msg = "" } = resData;
  // console.log("data: ", data);

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

  // 判断问卷是否删除
  if (isDeleted) {
    return (
      <PageWrapper>
        <h1>问卷已删除</h1>
        <p>msg</p>
      </PageWrapper>
    );
  }

  // 判断问卷是否发布
  if (!isPublished) {
    return (
      <PageWrapper>
        <h1>问卷未发布</h1>
        <p>msg</p>
      </PageWrapper>
    );
  }

  // console.log("componentList:",componentList);

  const ComponentListElem = (
    <>
      {componentList?.map((c) => {
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
      <form action="/api/answer" method="post" className="space-y-6">
        <input type="hidden" name="questionId" value={_id} />
        {/* <div className={styles.componentWrapper}>
          <QuestionInput
            fe_id="c1"
            props={{ title: "你的姓名", placeholder: "请输入你的姓名..." }}
          />
        </div>
        <div className={styles.componentWrapper}>
          <QuestionRadio
            fe_id="c2"
            props={{
              title: "你的性别",
              options: [
                { value: "male", text: "男" },
                { value: "female", text: "女" },
              ],
              value: "male",
              isVertical: false,
            }}
          />
        </div> */}
        {ComponentListElem}
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
