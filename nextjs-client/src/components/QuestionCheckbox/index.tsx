"use client";

import { FC } from "react";
import { useState, useEffect } from "react";

type PropsType = {
  fe_id: string;
  props: {
    title: string;
    isVertical?: boolean;
    options: Array<{
      value: string;
      text: string;
      checked: boolean;
    }>;
  };
};

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

  // 切换选中
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
      <p className="text-lg font-medium text-gray-700">{title}</p>
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
                <input
                  type="checkbox"
                  name={fe_id}
                  value={value}
                  checked={selectedValues.includes(value)}
                  onChange={() => toggleChecked(value)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300 cursor-pointer"
                />
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
