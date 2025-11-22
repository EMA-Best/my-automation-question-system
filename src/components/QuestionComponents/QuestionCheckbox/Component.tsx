import { FC } from 'react';
import { Typography, Space, Checkbox } from 'antd';
import {
  QuestionCheckboxDefaultProps,
  QuestionCheckboxPropsType,
} from './interface';

const { Paragraph } = Typography;

const QuestionCheckbox: FC<QuestionCheckboxPropsType> = (props) => {
  const {
    title,
    isVertical,
    options = [],
  } = {
    ...QuestionCheckboxDefaultProps,
    ...props,
  };
  return (
    <div>
      <Paragraph strong>{title}</Paragraph>
      <Space direction={isVertical ? 'vertical' : 'horizontal'}>
        {options.map((opt) => {
          const { value, text, checked } = opt;
          return (
            <Checkbox key={value} value={value} checked={checked}>
              {text}
            </Checkbox>
          );
        })}
      </Space>
    </div>
  );
};

export default QuestionCheckbox;
