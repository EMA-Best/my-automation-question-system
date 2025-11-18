import { FC, useEffect } from 'react';
import { Form, Input } from 'antd';
import { QuestionInputPropsType } from './interface';

const PropComponent: FC<QuestionInputPropsType> = (props) => {
  const { title, placeholder, onChange, disabled } = props;
  const [form] = Form.useForm();

  useEffect(() => {
    form.setFieldsValue({
      title,
      placeholder,
    });
  }, [title, placeholder]);

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
      initialValues={{ title, placeholder }}
      onValuesChange={handleChange}
    >
      <Form.Item
        name="title"
        label="标题"
        rules={[{ required: true, message: '请输入标题' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="placeholder" label="Placeholder">
        <Input />
      </Form.Item>
    </Form>
  );
};

export default PropComponent;
