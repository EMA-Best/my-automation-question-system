import { FC, useEffect } from 'react';
import useGetPageInfo from '../../../../../hooks/useGetPageInfo';
import { Form, Input } from 'antd';
import { useDispatch } from 'react-redux';
import { resetPageInfo } from '../../../../../store/pageInfoReducer';

const { TextArea } = Input;

const PageSetting: FC = () => {
  const pageInfo = useGetPageInfo();
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // 实时更新表单内容
  useEffect(() => {
    form.setFieldsValue(pageInfo);
  }, [pageInfo]);

  function handleValuesChange() {
    const newValues = form.getFieldsValue();
    dispatch(resetPageInfo(newValues));
  }

  return (
    <Form
      layout="vertical"
      initialValues={pageInfo}
      onValuesChange={handleValuesChange}
      form={form}
    >
      <Form.Item
        label="问卷标题"
        name="title"
        rules={[{ required: true, message: '请输入问卷标题' }]}
      >
        <Input placeholder="请输入标题"></Input>
      </Form.Item>
      <Form.Item label="问卷描述" name="desc">
        <TextArea placeholder="问卷描述..."></TextArea>
      </Form.Item>
      <Form.Item label="样式代码" name="css">
        <TextArea placeholder="输入 CSS 样式代码..."></TextArea>
      </Form.Item>
      <Form.Item label="脚本代码" name="js">
        <TextArea placeholder="输入 JS 脚本代码..."></TextArea>
      </Form.Item>
    </Form>
  );
};

export default PageSetting;
