import { FC } from "react";

type PropsType = {
  // 不需要 fe_id
  text: string;
  level: number;
  isCenter?: boolean;
};

const QuestionTitle: FC<PropsType> = (props) => {
  console.log("props:", props);

  const { text, level, isCenter } = props;
  const centerClass = isCenter ? "text-center" : "";

  if (level === 1) {
    return (
      <h1 className={`text-4xl font-bold text-gray-800 mb-6 ${centerClass}`}>
        {text}
      </h1>
    );
  }
  if (level === 2) {
    return (
      <h2 className={`text-3xl font-bold text-gray-800 mb-4 ${centerClass}`}>
        {text}
      </h2>
    );
  }
  if (level === 3) {
    return (
      <h3 className={`text-2xl font-semibold text-gray-700 mb-3 ${centerClass}`}>
        {text}
      </h3>
    );
  }

  return null;
};

export default QuestionTitle;
