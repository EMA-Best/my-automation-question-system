import { FC, useCallback, useEffect } from 'react';
import {
  Typography,
  Space,
  Button,
  Form,
  Input,
  Checkbox,
  message,
} from 'antd';
import type { FormProps } from 'antd';
import { LockOutlined, UserAddOutlined, UserOutlined } from '@ant-design/icons';
import { useTitle, useRequest } from 'ahooks';
import { Link } from 'react-router-dom';
import styles from './index.module.scss';
import { routePath } from '../../router/index';
import { loginService } from '../../services/user';
import { setToken } from '../../utils/user-token';
import useLoadUserData from '../../hooks/useLoadUserData';

// 解构出Title组件
const { Title } = Typography;

// 定义存储在localStorage中的key
const USERNAME_KEY = 'USERNAME';
const PASSWORD_KEY = 'PASSWORD';

// 记住用户登录信息
const rememberUser = (username: string, password: string) => {
  localStorage.setItem(USERNAME_KEY, username);
  localStorage.setItem(PASSWORD_KEY, password);
};

// 忘记用户登录信息
const forgetUser = () => {
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(PASSWORD_KEY);
};

// 从localStorage中获取用户信息
const getUserInfoFromStorage = () => {
  const username = localStorage.getItem(USERNAME_KEY);
  const password = localStorage.getItem(PASSWORD_KEY);
  return { username, password };
};

type LoginFormValues = {
  username: string;
  password: string;
  remember?: boolean;
};

const Login: FC = () => {
  useTitle('小伦问卷 - 登录');
  // antd表单实例 用于设置表单默认值
  const [form] = Form.useForm<LoginFormValues>();
  // 获取loadUserInfo函数
  const { loadUserInfo } = useLoadUserData();

  // 登录
  const { run: handleLogin, loading } = useRequest(
    async (username: string, password: string) => {
      const result = await loginService(username, password);
      return result;
    },
    {
      manual: true,
      onSuccess(result) {
        const { token } = result;
        setToken(token);
        message.success('登录成功');
        // 立即加载用户信息到Redux store（随后由路由守卫跳转）
        loadUserInfo();
      },
      onError(error) {
        const errMsg =
          error instanceof Error && error.message
            ? error.message
            : '用户名或密码错误';
        message.error(errMsg);
      },
    }
  );

  // 组件挂载时获取用户信息
  useEffect(() => {
    // 获取用户信息
    const { username, password } = getUserInfoFromStorage();
    // 如果有用户信息，设置表单默认值
    if (username && password) {
      form.setFieldsValue({
        username,
        password,
      });
    }
  }, [form]);

  // 表单提交成功回调
  const onFinish = useCallback<
    NonNullable<FormProps<LoginFormValues>['onFinish']>
  >(
    (values) => {
      const { username, password, remember } = values;
      handleLogin(username, password);

      if (remember) {
        rememberUser(username, password);
      } else {
        forgetUser();
      }
    },
    [handleLogin]
  );

  const onFinishFailed = useCallback<
    NonNullable<FormProps<LoginFormValues>['onFinishFailed']>
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
              欢迎回来
            </Title>
            <div className={styles.subTitle}>登录后进入问卷管理与编辑</div>
          </div>
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        size="large"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        initialValues={{ remember: true }}
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
            placeholder="请输入用户名"
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
            placeholder="请输入密码"
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item name="remember" valuePropName="checked">
          <Checkbox>记住密码</Checkbox>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            登录
          </Button>
        </Form.Item>

        <div className={styles.footerRow}>
          <span className={styles.footerText}>还没有账号？</span>
          <Link to={routePath.REGISTER}>注册新用户</Link>
        </div>
      </Form>
    </div>
  );
};

export default Login;
