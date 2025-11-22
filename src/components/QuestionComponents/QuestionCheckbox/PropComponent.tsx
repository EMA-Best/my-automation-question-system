import { FC } from 'react';
import { OptionType, QuestionCheckboxPropsType } from './interface';
import { Button, Checkbox, Form, Input, Space } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { nanoid } from 'nanoid';

const PropComponent: FC<QuestionCheckboxPropsType> = (props) => {
  const { title, isVertical, options = [], onChange, disabled } = props;
  const [form] = Form.useForm();

  function handleValuesChange() {
    // 调用 onChange
    if (onChange == null) return;
    // 从表单中获取最新值
    const newValus = form.getFieldsValue();

    const { options = [] } = newValus;
    // 遍历添加value值 因为是空的 所以需要添加
    options.forEach((opt: OptionType) => {
      if (opt.value) return;
      opt.value = nanoid(5);
    });
    // 调用 onChange
    onChange(newValus);
  }

  return (
    <Form
      layout="vertical"
      form={form}
      initialValues={{ title, isVertical, options }}
      disabled={disabled}
      onValuesChange={handleValuesChange}
    >
      <Form.Item
        label="标题"
        name="title"
        rules={[{ required: true, message: '请输入标题' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item label="选项">
        <Form.List name="options">
          {(fields, { add, remove }) => {
            return (
              <>
                {/**遍历所有的选项(可删除) */}
                {fields.map((field, index) => {
                  const { key, name } = field;
                  return (
                    <Space key={key} align="baseline">
                      {/* 当前选项 是否选中 */}
                      <Form.Item
                        name={[name, 'checked']}
                        valuePropName="checked"
                      >
                        <Checkbox />
                      </Form.Item>

                      {/* 当前选项 输入框*/}
                      <Form.Item
                        name={[name, 'text']}
                        rules={[
                          { required: true, message: '请输入选项文字' },
                          {
                            validator: (_, text) => {
                              const { options = [] } = form.getFieldsValue();
                              // 计数
                              let num = 0;
                              // 遍历判断text是否有重复
                              options.forEach((opt: OptionType) => {
                                if (opt.text === text) num++; // 记录text相同的个数
                              });
                              // 个数只有一个 正常
                              if (num === 1) return Promise.resolve();
                              // 个数大于一个 提示重复
                              return Promise.reject(
                                new Error('和其他选项重复')
                              );
                            },
                          },
                        ]}
                      >
                        <Input placeholder="请输入选项文字..." />
                      </Form.Item>

                      {/* 当前选项 删除按钮 大于两个的时候才让删除 */}
                      {index > 1 && (
                        <MinusCircleOutlined onClick={() => remove(name)} />
                      )}
                    </Space>
                  );
                })}
                {/* 添加选项 */}
                <Form.Item>
                  <Button
                    type="link"
                    onClick={() => add({ text: '', value: '' })}
                    icon={<PlusOutlined />}
                    block
                  >
                    添加选项
                  </Button>
                </Form.Item>
              </>
            );
          }}
        </Form.List>
      </Form.Item>
      <Form.Item name="isVertical" valuePropName="checked">
        <Checkbox>竖向排列</Checkbox>
      </Form.Item>
    </Form>
  );
};

export default PropComponent;
