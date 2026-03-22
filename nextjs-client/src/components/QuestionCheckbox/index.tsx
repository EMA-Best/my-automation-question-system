/**
 * 复选框组件
 * 用于问卷中的多选问题
 * 使用客户端组件，支持状态管理
 */
"use client";

import { FC } from "react";
import { useState, useEffect } from "react";

/**
 * 复选框组件属性类型
 */
type PropsType = {
  fe_id: string;           // 前端组件ID，用于表单提交和元素标识
  props: {
    title: string;         // 问题标题
    isVertical?: boolean;   // 是否垂直排列选项
    options: Array<{
      value: string;       // 选项值
      text: string;        // 选项文本
      checked: boolean;    // 是否默认选中
    }>;
  };
};

/**
 * 复选框组件
 * @param fe_id 前端组件ID
 * @param props 组件属性
 * @returns 复选框组件JSX
 */
const QuestionCheckbox: FC<PropsType> = ({ fe_id, props }) => {
  const { title, isVertical, options = [] } = props;

  // 存储选中的值
  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  // 初始化时，判断默认选中
  useEffect(() => {
    options.forEach((item) => {
      const { value, checked } = item;
      if (checked) {
        setSelectedValues((selectedValues) => [...selectedValues, value]);
      }
    });
  }, [options]);

  /**
   * 切换选项的选中状态
   * @param value 要切换的选项值
   */
  function toggleChecked(value: string) {
    if (selectedValues.includes(value)) {
      // 选中则取消选中
      setSelectedValues((selectedValues) =>
        selectedValues.filter((v) => v !== value),
      );
    } else {
      // 未选中则选中
      setSelectedValues((selectedValues) => [...selectedValues, value]);
    }
  }

  return (
    <div className="space-y-4">
      {/* 问题标题 */}
      <p className="text-lg font-medium text-gray-700">{title}</p>
      {/* 选项列表 */}
      <ul
        className={`${isVertical ? "space-y-3" : "flex flex-wrap gap-x-8 gap-y-3"}`}
      >
        {options.map((item) => {
          const { value, text } = item;

          return (
            <li
              key={value}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <label className="flex items-center space-x-2 cursor-pointer">
                {/* 复选框 */}
                <input
                  type="checkbox"
                  name={fe_id}
                  value={value}
                  checked={selectedValues.includes(value)}
                  onChange={() => toggleChecked(value)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer"
                />
                {/* 选项文本 */}
                <span className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                  {text}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default QuestionCheckbox;
