import { FC, useEffect } from 'react';
import { QuestionParagraphPropsType } from './interface';
import { Checkbox, Form, Input } from 'antd';

const { TextArea } = Input;

const PropComponent: FC<QuestionParagraphPropsType> = (props) => {
  const { text, isCenter, onChange, disabled } = props;
  const [form] = Form.useForm();

  // 初始化表单值 还有后续同步更新
  useEffect(() => {
    form.setFieldsValue({ text, isCenter });
  }, [text, isCenter]);

  // 监听表单值变化
  const handleValuesChange = () => {
    const value = form.getFieldsValue();
    onChange && onChange(value);
  };
  return (
    <Form
      layout="vertical"
      initialValues={{ text, isCenter }}
      onValuesChange={handleValuesChange}
      disabled={disabled}
      form={form}
    >
      <Form.Item
        label="段落内容"
        name="text"
        rules={[{ required: true, message: '请输入段落内容' }]}
      >
        <TextArea />
      </Form.Item>
      <Form.Item name="isCenter" valuePropName="checked">
        <Checkbox>居中显示</Checkbox>
      </Form.Item>
    </Form>
  );
};

export default PropComponent;
