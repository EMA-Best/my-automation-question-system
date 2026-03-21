import { FC, useCallback, useMemo } from 'react';
import { Alert, Form, Input, Modal } from 'antd';
import type { FormProps } from 'antd';

/* eslint-disable no-unused-vars */
export type ChangePasswordModalProps = {
  open: boolean;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (...args: [string, string]) => void;
  /** 是否强制改密（管理员重置后） */
  force?: boolean;
};
/* eslint-enable no-unused-vars */

type PasswordFormValues = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const ChangePasswordModal: FC<ChangePasswordModalProps> = (props) => {
  const { open, loading, onCancel, onSubmit, force = false } = props;

  const [form] = Form.useForm<PasswordFormValues>();

  const onFinish = useCallback<
    NonNullable<FormProps<PasswordFormValues>['onFinish']>
  >(
    (values) => {
      onSubmit(values.oldPassword, values.newPassword);
      form.resetFields();
    },
    [form, onSubmit]
  );

  const modalTitle = useMemo(() => {
    return force ? '请立即修改密码' : '修改密码';
  }, [force]);

  const okText = useMemo(() => {
    return force ? '修改并重新登录' : '修改';
  }, [force]);

  return (
    <Modal
      title={modalTitle}
      open={open}
      onCancel={force ? undefined : onCancel}
      okText={okText}
      cancelText={force ? undefined : '取消'}
      okButtonProps={{ loading }}
      cancelButtonProps={force ? { style: { display: 'none' } } : undefined}
      closable={!force}
      maskClosable={!force}
      keyboard={!force}
      onOk={form.submit}
      destroyOnClose
    >
      {force ? (
        <Alert
          type="warning"
          showIcon
          message="检测到你的密码已被管理员重置"
          description="为保障账号安全，你需要立即设置新密码。修改完成后将要求你重新登录。"
          style={{ marginBottom: 12 }}
        />
      ) : null}
      <Form form={form} layout="vertical" onFinish={onFinish} preserve={false}>
        <Form.Item
          label="旧密码"
          name="oldPassword"
          rules={[
            { required: true, message: '请输入旧密码' },
            {
              type: 'string',
              min: 6,
              max: 12,
              message: '密码长度必须在6到12个字符之间',
            },
          ]}
        >
          <Input.Password
            placeholder="请输入旧密码"
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item
          label="新密码"
          name="newPassword"
          rules={[
            { required: true, message: '请输入新密码' },
            {
              type: 'string',
              min: 6,
              max: 12,
              message: '密码长度必须在6到12个字符之间',
            },
          ]}
        >
          <Input.Password
            placeholder="请输入新密码"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          label="确认新密码"
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: '请再次输入新密码' },
            ({ getFieldValue }) => ({
              validator(_, value: unknown) {
                const newPassword = getFieldValue('newPassword');
                if (typeof value !== 'string' || value.length === 0) {
                  return Promise.resolve();
                }
                if (value !== newPassword) {
                  return Promise.reject(new Error('两次输入的密码不一致'));
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <Input.Password
            placeholder="请再次输入新密码"
            autoComplete="new-password"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePasswordModal;
