import { FC } from 'react';
import { QuestionInfoDefaultProps, QuestionInfoPropsType } from './interface';
import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

const QuestionInfo: FC<QuestionInfoPropsType> = (props) => {
  const { title, desc = '' } = { ...QuestionInfoDefaultProps, ...props };
  // 解析描述文本为数组（按换行符分割）
  // 画布需要显示换行效果
  // console.log('QuestionInfo desc:', desc);

  const descTextList = desc.split('\n');

  // console.log('QuestionInfo descTextList:', descTextList);

  return (
    <div style={{ textAlign: 'center' }}>
      <Title style={{ fontSize: '24px' }}>{title}</Title>
      <Paragraph>
        {descTextList.map((dt, index) => (
          <span key={index}>
            {index > 0 && <br />}
            {dt}
          </span>
        ))}
      </Paragraph>
    </div>
  );
};

export default QuestionInfo;
