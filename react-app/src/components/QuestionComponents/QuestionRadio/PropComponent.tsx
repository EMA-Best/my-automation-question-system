import { FC, useEffect } from 'react';
import { QuestionRadioPropsType, OptionType } from './interface';
import { Button, Checkbox, Form, Input, Select, Space } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { nanoid } from 'nanoid';

const PropComponent: FC<QuestionRadioPropsType> = (props) => {
  const { title, isVertical, options = [], value, onChange, disabled } = props;
  const [form] = Form.useForm();

  // 监听 props 变化，更新表单值
  useEffect(() => {
    form.setFieldsValue({
      title,
      isVertical,
      options,
      value,
    });
  }, [title, isVertical, options, value]);

  // 监听表单值变化，触发 onChange 回调
  function handleValuesChange() {
    if (onChange == null) return;
    const newValues = form.getFieldsValue();
    console.log('newValues: ', newValues);
    const { options = [] } = newValues;
    // 遍历添加value值 因为是空的 所以需要添加
    options.forEach((opt: OptionType) => {
      if (opt.value) return;
      opt.value = nanoid(5);
    });
    // console.log('newValues', newValues);
    onChange(newValues);
  }

  return (
    <Form
      layout="vertical"
      initialValues={{ title, isVertical, value, options }}
      onValuesChange={handleValuesChange}
      disabled={disabled}
      form={form}
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
                  // console.log('cur field: ', field);

                  const { key, name } = field;
                  return (
                    <Space key={key} align="baseline">
                      {/* 当前选项 输入框*/}
                      <Form.Item
                        name={[name, 'text']}
                        rules={[
                          { required: true, message: '请输入选项文字' },
                          {
                            validator: (_, text) => {
                              const { options = [] } = form.getFieldsValue();
                              console.log('cur options: ', options);
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
      <Form.Item label="默认选中" name="value">
        <Select
          value={value}
          placeholder="请选择..."
          options={options.map((opt) => {
            const { text, value } = opt;
            return {
              label: text || '',
              value,
            };
          })}
        ></Select>
      </Form.Item>
      <Form.Item name="isVertical" valuePropName="checked">
        <Checkbox>竖向排列</Checkbox>
      </Form.Item>
    </Form>
  );
};

export default PropComponent;
