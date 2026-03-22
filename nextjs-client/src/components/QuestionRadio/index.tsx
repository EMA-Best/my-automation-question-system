/**
 * 单选框组件
 * 用于问卷中的单选问题
 */
import { FC } from "react";

/**
 * 单选框组件属性类型
 */
type PropsType = {
  fe_id: string;           // 前端组件ID，用于表单提交和元素标识
  props: {
    title: string;         // 问题标题
    options: Array<{
      value: string;       // 选项值
      text: string;        // 选项文本
    }>;
    value: string;         // 默认选中值
    isVertical: boolean;   // 是否垂直排列选项
  };
};

/**
 * 单选框组件
 * @param fe_id 前端组件ID
 * @param props 组件属性
 * @returns 单选框组件JSX
 */
const QuestionRadio: FC<PropsType> = ({ fe_id, props }) => {
  const { title, options = [], value, isVertical } = props;

  return (
    <div className="space-y-4">
      {/* 问题标题 */}
      <p className="text-lg font-medium text-gray-700">{title}</p>
      {/* 选项列表 */}
      <ul
        className={`${isVertical ? "space-y-3" : "flex flex-wrap gap-x-8 gap-y-3"}`}
      >
        {options.map((opt) => {
          const { value: val, text } = opt;

          return (
            <li
              key={val}
              className="flex items-center space-x-2 cursor-pointer"
            >
              {/* 单选按钮 */}
              <input
                id={`${fe_id}-${val}`}
                type="radio"
                value={val}
                defaultChecked={val === value}
                name={fe_id}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
              />
              {/* 选项标签 */}
              <label
                htmlFor={`${fe_id}-${val}`}
                className="text-gray-600 cursor-pointer hover:text-blue-600 transition-colors duration-200"
              >
                {text}
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default QuestionRadio;
