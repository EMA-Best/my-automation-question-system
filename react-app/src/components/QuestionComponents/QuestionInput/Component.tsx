import { FC } from 'react';
import { Typography, Input } from 'antd';
import { QuestionInputPropsType, QuestionInputDefaultProps } from './interface';

const { Paragraph } = Typography;

const QustionInput: FC<QuestionInputPropsType> = (props) => {
  const { title, placeholder } = {
    ...QuestionInputDefaultProps,
    ...props,
  };

  return (
    <div>
      <Paragraph strong>{title}</Paragraph>
      <div>
        <Input placeholder={placeholder} />
      </div>
    </div>
  );
};

export default QustionInput;
