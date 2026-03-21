import { FC } from 'react';
import { Typography } from 'antd';
import {
  QuestionParagraphPropsType,
  QuestionParagraphDefaultProps,
} from './interface';

const { Paragraph } = Typography;

const QuestionParagraph: FC<QuestionParagraphPropsType> = (props) => {
  const { text = '', isCenter = false } = {
    ...QuestionParagraphDefaultProps,
    ...props,
  };
  // 以换行符分割文本
  // 同步画布实现输入有换行符的段落
  const textList = text.split('\n');
  return (
    <Paragraph style={{ textAlign: isCenter ? 'center' : 'start' }}>
      {textList.map((t, index) => {
        return (
          <span key={index}>
            {index > 0 && <br />}
            {t}
          </span>
        );
      })}
    </Paragraph>
  );
};

export default QuestionParagraph;
