import { FC } from "react";

type PropsType = {
  fe_id: string;
  props: {
    title: string;
    placeholder: string;
  };
};

const QuestionInput: FC<PropsType> = ({ fe_id, props }) => {
  const { title, placeholder = "" } = props;
  return (
    <div className="space-y-2">
      <label htmlFor={fe_id} className="block text-lg font-medium text-gray-700">
        {title}
      </label>
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
