import { FC, useCallback, useEffect, useMemo } from 'react';
import { Form, Input, Modal } from 'antd';
import type { FormProps } from 'antd';

/* eslint-disable no-unused-vars */
export type EditProfileModalProps = {
  open: boolean;
  nickname: string;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (...args: [string]) => void;
};
/* eslint-enable no-unused-vars */

type ProfileFormValues = {
  nickname: string;
};

const EditProfileModal: FC<EditProfileModalProps> = (props) => {
  const { open, nickname, loading, onCancel, onSubmit } = props;

  const [form] = Form.useForm<ProfileFormValues>();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({ nickname });
  }, [form, nickname, open]);

  const onFinish = useCallback<
    NonNullable<FormProps<ProfileFormValues>['onFinish']>
  >(
    (values) => {
      onSubmit(values.nickname.trim());
    },
    [onSubmit]
  );

  const modalTitle = useMemo(() => '修改资料', []);

  return (
    <Modal
      title={modalTitle}
      open={open}
      onCancel={onCancel}
      okText="保存"
      cancelText="取消"
      okButtonProps={{ loading }}
      onOk={form.submit}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish} preserve={false}>
        <Form.Item
          label="昵称"
          name="nickname"
          rules={[
            { required: true, message: '请输入昵称' },
            {
              type: 'string',
              min: 2,
              max: 20,
              message: '昵称长度 2-20 个字符',
            },
          ]}
        >
          <Input placeholder="请输入昵称" allowClear />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditProfileModal;
