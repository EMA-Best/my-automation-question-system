import { FC } from 'react';
import { QuestionTitlePropsType, QuestionTitleDefaultProps } from './interface';
import { Typography } from 'antd';

const { Title } = Typography;

const QuestionTitle: FC<QuestionTitlePropsType> = (props) => {
  const {
    text = '',
    level = 1,
    isCenter = false,
  } = { ...QuestionTitleDefaultProps, ...props };

  const getFontSize = (level: number) => {
    if (level === 1) return '24px';
    if (level === 2) return '20px';
    if (level === 3) return '16px';
    return '16px';
  };

  return (
    <Title
      level={level}
      style={{
        textAlign: isCenter ? 'center' : 'left',
        fontSize: getFontSize(level),
        margin: '0',
      }}
    >
      {text}
    </Title>
  );
};

export default QuestionTitle;
