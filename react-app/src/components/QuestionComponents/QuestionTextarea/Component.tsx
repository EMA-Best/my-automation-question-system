import { FC } from 'react';
import { Typography, Input } from 'antd';
import {
  QustionTextareaPropsType,
  QustionTextareaDefaultProps,
} from './interface';

const { Paragraph } = Typography;
const { TextArea } = Input;

const QustionTextarea: FC<QustionTextareaPropsType> = (props) => {
  const { title, placeholder } = {
    ...QustionTextareaDefaultProps,
    ...props,
  };

  return (
    <div>
      <Paragraph strong>{title}</Paragraph>
      <div>
        <TextArea placeholder={placeholder} />
      </div>
    </div>
  );
};

export default QustionTextarea;
