import { FC } from "react";

type PropsType = {
  fe_id: string;
  props: {
    title: string;
    options: Array<{
      value: string;
      text: string;
    }>;
    value: string;
    isVertical: boolean;
  };
};

const QuestionRadio: FC<PropsType> = ({ fe_id, props }) => {
  const { title, options = [], value, isVertical } = props;

  return (
    <div className="space-y-4">
      <p className="text-lg font-medium text-gray-700">{title}</p>
      <ul
        className={`${isVertical ? "space-y-3" : "flex flex-wrap gap-x-8 gap-y-3"}`}
      >
        {options.map((opt) => {
          console.log("cur opt: ", opt);
          const { value: val, text } = opt;

          return (
            <li
              key={val}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <input
                id={`${fe_id}-${val}`}
                type="radio"
                value={val}
                defaultChecked={val === value}
                name={fe_id}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer"
              />
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
