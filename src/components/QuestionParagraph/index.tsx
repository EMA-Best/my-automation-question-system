import { FC } from "react";

type PropsType = {
  text: string;
  isCenter?: boolean;
};

const QuestionParagraph: FC<PropsType> = (props) => {
  const { text, isCenter } = props;

  // 换行
  const textList = text.split("\n");

  return (
    <p className={`text-gray-600 text-lg leading-relaxed ${isCenter ? 'text-center' : ''} mb-6`}>
      {textList.map((t, index) => (
        <span key={index}>
          {index > 0 && <br />}
          {t}
        </span>
      ))}
    </p>
  );
};

export default QuestionParagraph;
