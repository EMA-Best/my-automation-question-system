/**
 * 组件索引文件
 * 定义问卷系统中所有组件的类型和获取组件的函数
 */
import QuestionInput from "./QuestionInput";
import QuestionRadio from "./QuestionRadio";
import QuestionInfo from "./QuestionInfo";
import QuestionTitle from "./QuestionTitle";
import QuestionParagraph from "./QuestionParagraph";
import QuestionTextarea from "./QuestionTextarea";
import QuestionCheckbox from "./QuestionCheckbox";

/**
 * 输入框组件属性类型
 */
type QuestionInputProps = {
  title: string;            // 问题标题
  placeholder: string;      // 输入框占位符
};

/**
 * 单选框组件属性类型
 */
type QuestionRadioProps = {
  title: string;                                    // 问题标题
  options: Array<{ value: string; text: string }>;   // 选项列表
  value: string;                                    // 默认选中值
  isVertical: boolean;                              // 是否垂直排列
};

/**
 * 复选框组件属性类型
 */
type QuestionCheckboxProps = {
  title: string;                                                    // 问题标题
  isVertical?: boolean;                                            // 是否垂直排列
  options: Array<{ value: string; text: string; checked: boolean }>; // 选项列表
};

/**
 * 文本域组件属性类型
 */
type QuestionTextareaProps = {
  title: string;        // 问题标题
  placeholder?: string; // 文本域占位符
};

/**
 * 信息展示组件属性类型
 */
type QuestionInfoProps = {
  title: string;    // 信息标题
  desc?: string;    // 信息描述
};

/**
 * 标题组件属性类型
 */
type QuestionTitleProps = {
  text: string;     // 标题文本
  level: number;    // 标题级别（1-6）
  isCenter?: boolean; // 是否居中对齐
};

/**
 * 段落组件属性类型
 */
type QuestionParagraphProps = {
  text: string;     // 段落文本
  isCenter?: boolean; // 是否居中对齐
};

/**
 * 组件信息类型
 * 联合类型，包含所有支持的组件类型
 */
type ComponentInfoType =
  | {
      fe_id: string;               // 前端组件ID
      type: "questionInput";       // 组件类型：输入框
      isHidden: boolean;           // 是否隐藏
      props: QuestionInputProps;    // 组件属性
    }
  | {
      fe_id: string;               // 前端组件ID
      type: "questionRadio";       // 组件类型：单选框
      isHidden: boolean;           // 是否隐藏
      props: QuestionRadioProps;    // 组件属性
    }
  | {
      fe_id: string;                 // 前端组件ID
      type: "questionCheckbox";      // 组件类型：复选框
      isHidden: boolean;             // 是否隐藏
      props: QuestionCheckboxProps;   // 组件属性
    }
  | {
      fe_id: string;                 // 前端组件ID
      type: "questionTextarea";      // 组件类型：文本域
      isHidden: boolean;             // 是否隐藏
      props: QuestionTextareaProps;   // 组件属性
    }
  | {
      fe_id: string;               // 前端组件ID
      type: "questionInfo";        // 组件类型：信息展示
      isHidden: boolean;           // 是否隐藏
      props: QuestionInfoProps;     // 组件属性
    }
  | {
      fe_id: string;                // 前端组件ID
      type: "questionTitle";        // 组件类型：标题
      isHidden: boolean;            // 是否隐藏
      props: QuestionTitleProps;     // 组件属性
    }
  | {
      fe_id: string;                  // 前端组件ID
      type: "questionParagraph";      // 组件类型：段落
      isHidden: boolean;              // 是否隐藏
      props: QuestionParagraphProps;   // 组件属性
    };

/**
 * 根据组件信息获取对应的React组件
 * @param comp 组件信息对象
 * @returns 对应的React组件或null（如果组件隐藏）
 */
export const getComponent = (comp: ComponentInfoType) => {
  // 如果组件隐藏，返回null
  if (comp.isHidden) return null;

  // 根据组件类型返回对应的React组件
  switch (comp.type) {
    case "questionInput":
      return <QuestionInput fe_id={comp.fe_id} props={comp.props} />;
    case "questionRadio":
      return <QuestionRadio fe_id={comp.fe_id} props={comp.props} />;
    case "questionCheckbox":
      return <QuestionCheckbox fe_id={comp.fe_id} props={comp.props} />;
    case "questionTextarea":
      return <QuestionTextarea fe_id={comp.fe_id} props={comp.props} />;
    case "questionInfo":
      return <QuestionInfo title={comp.props.title} desc={comp.props.desc} />;
    case "questionTitle":
      return <QuestionTitle {...comp.props} />;
    case "questionParagraph":
      return <QuestionParagraph {...comp.props} />;
    default:
      return null;
  }
};
