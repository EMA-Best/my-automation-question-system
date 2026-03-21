import { FC } from "react";

type PropsType = {
  title: string;
  desc?: string;
};

const QuestionInfo: FC<PropsType> = (props) => {
  const { title, desc } = props;
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-800 mb-3">{title}</h1>
      {desc && (
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">{desc}</p>
      )}
    </div>
  );
};

export default QuestionInfo;
