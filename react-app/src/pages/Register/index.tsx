import { FC, useCallback } from 'react';
import { Typography, Space, Button, Form, Input, message } from 'antd';
import type { FormProps } from 'antd';
import {
  LockOutlined,
  SmileOutlined,
  UserAddOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useTitle, useRequest } from 'ahooks';
import { Link, useNavigate } from 'react-router-dom';
import styles from './index.module.scss';
import { routePath } from '../../router/index';
import { registerService } from '../../services/user';

const { Title } = Typography;

type RegisterFormValues = {
  username: string;
  password: string;
  confirmPassword: string;
  nickname?: string;
};

const Register: FC = () => {
  useTitle('小伦问卷 - 注册');
  const navigate = useNavigate();
  // 注册用户
  const { run: handleRegister, loading } = useRequest(
    async (userInfo: RegisterFormValues) => {
      const { username, password, nickname } = userInfo;
      await registerService(username, password, nickname);
    },
    {
      manual: true,
      onSuccess() {
        message.success('注册成功');
        // 去登陆页面
        navigate(routePath.LOGIN);
      },
    }
  );

  const onFinish = useCallback<
    NonNullable<FormProps<RegisterFormValues>['onFinish']>
  >(
    (values) => {
      handleRegister(values);
    },
    [handleRegister]
  );

  const onFinishFailed = useCallback<
    NonNullable<FormProps<RegisterFormValues>['onFinishFailed']>
  >((errorInfo) => {
    console.log(errorInfo);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Space size={10} align="center">
          <span className={styles.headerIcon}>
            <UserAddOutlined />
          </span>
          <div>
            <Title level={3} className={styles.title}>
              创建账号
            </Title>
            <div className={styles.subTitle}>注册后即可创建并管理你的问卷</div>
          </div>
        </Space>
      </div>

      <Form
        layout="vertical"
        size="large"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        <Form.Item
          label="用户名"
          name="username"
          rules={[
            { required: true, message: '请输入用户名' },
            {
              type: 'string',
              min: 6,
              max: 10,
              message: '长度必须在6到10个字符之间',
            },
            {
              pattern: /^[a-zA-Z0-9_]+$/,
              message: '只能包含字母、数字和下划线',
            },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="6-10 位字母/数字/下划线"
            allowClear
            autoComplete="username"
          />
        </Form.Item>

        <Form.Item
          label="密码"
          name="password"
          rules={[
            { required: true, message: '请输入密码' },
            {
              type: 'string',
              min: 6,
              max: 12,
              message: '密码长度必须在6到12个字符之间',
            },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="6-12 位密码"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          label="确认密码"
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: '请输入确认密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('两次输入密码不一致'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请再次输入密码"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item label="昵称（可选）" name="nickname">
          <Input prefix={<SmileOutlined />} placeholder="用于展示" allowClear />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            注册
          </Button>
        </Form.Item>

        <div className={styles.footerRow}>
          <span className={styles.footerText}>已有账号？</span>
          <Link to={routePath.LOGIN}>去登录</Link>
        </div>
      </Form>
    </div>
  );
};

export default Register;
