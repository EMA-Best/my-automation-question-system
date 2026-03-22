/**
 * 输入框组件
 * 用于问卷中的文本输入问题
 */
import { FC } from "react";

/**
 * 输入框组件属性类型
 */
type PropsType = {
  fe_id: string;           // 前端组件ID，用于表单提交和元素标识
  props: {
    title: string;         // 问题标题
    placeholder: string;   // 输入框占位符
  };
};

/**
 * 输入框组件
 * @param fe_id 前端组件ID
 * @param props 组件属性
 * @returns 输入框组件JSX
 */
const QuestionInput: FC<PropsType> = ({ fe_id, props }) => {
  const { title, placeholder = "" } = props;
  return (
    <div className="space-y-2">
      {/* 问题标题 */}
      <label htmlFor={fe_id} className="block text-lg font-medium text-gray-700">
        {title}
      </label>
      {/* 输入框 */}
      <div className="relative">
        <input 
          id={fe_id} 
          type="text" 
          placeholder={placeholder} 
          name={fe_id} 
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm hover:border-gray-400 transition-colors duration-200"
        />
      </div>
    </div>
  );
};

export default QuestionInput;
