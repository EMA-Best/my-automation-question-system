import { FC, useEffect } from 'react';
import { Form, Input, Select, Checkbox } from 'antd';
import { QuestionTitlePropsType } from './interface';

const PropComponent: FC<QuestionTitlePropsType> = (props) => {
  const { text, level, isCenter, onChange } = props;
  const [form] = Form.useForm();

  // 组件挂载时，初始化表单值（更新）
  useEffect(() => {
    form.setFieldsValue({ text, level, isCenter });
  }, [text, level, isCenter]);

  const handleChange = () => {
    // 获取所有表单值
    const newProps = form.getFieldsValue();
    onChange && onChange(newProps);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ text, level, isCenter }}
      onValuesChange={handleChange}
    >
      <Form.Item
        name="text"
        label="标题内容"
        rules={[{ required: true, message: '请输入标题内容' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item name="level" label="层级">
        <Select
          options={[
            { value: 1, text: 1 },
            { value: 2, text: 2 },
            { value: 3, text: 3 },
          ]}
        />
      </Form.Item>
      <Form.Item name="isCenter" valuePropName="checked">
        <Checkbox>居中显示</Checkbox>
      </Form.Item>
    </Form>
  );
};

export default PropComponent;
