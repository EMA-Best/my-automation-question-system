import { Form, Input } from 'antd';
import { QuestionInfoPropsType } from './interface';
import { FC, useEffect } from 'react';

const { TextArea } = Input;

const PropComponent: FC<QuestionInfoPropsType> = (props) => {
  const { title, desc, onChange, disabled } = props;
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      title,
      desc,
    });
  }, [title, desc]);

  // 监听表单值变化，触发 onChange 回调
  const handleChange = () => {
    const newProps = form.getFieldsValue();
    onChange && onChange(newProps);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      disabled={disabled}
      initialValues={{ title, desc }}
      onValuesChange={handleChange}
    >
      <Form.Item
        name="title"
        label="标题"
        rules={[{ required: true, message: '请输入标题' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="desc" label="描述">
        <TextArea />
      </Form.Item>
    </Form>
  );
};

export default PropComponent;
