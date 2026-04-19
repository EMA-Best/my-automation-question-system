import { FC, useCallback, useEffect, useState } from 'react';
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
import { Link, useSearchParams } from 'react-router-dom';
import styles from './index.module.scss';
import { routePath } from '../../router/index';
import { getUserInfoService, loginService } from '../../services/user';
import { getToken, removeToken, setToken } from '../../utils/user-token';
import useLoadUserData from '../../hooks/useLoadUserData';

// 解构出Title组件
const { Title } = Typography;

// 定义存储在localStorage中的key
const USERNAME_KEY = 'USERNAME';
const PASSWORD_KEY = 'PASSWORD';
// eslint-disable-next-line no-undef
const C_APP_ORIGIN = process.env.REACT_APP_C_APP_ORIGIN ?? '';
const SSO_BRIDGE_LAST_TS_KEY = '__b_sso_bridge_last_ts__';
const SSO_BRIDGE_COOLDOWN_MS = 3000;

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
  useTitle('登录 | 小伦问卷 · 管理端');
  const [searchParams] = useSearchParams();
  const [tokenCheckedAt, setTokenCheckedAt] = useState(0);

  const tokenFromQuery =
    searchParams.get('token') ??
    searchParams.get('access_token') ??
    searchParams.get('accessToken');

  const callbackUrlParam = searchParams.get('callbackUrl');
  const authBaseParam = searchParams.get('authBase');
  // authBase: C 认证中心地址（由 C 端发起跳转时注入）
  const cAuthOrigin = authBaseParam || C_APP_ORIGIN || 'http://localhost:3000';
  // antd表单实例 用于设置表单默认值
  const [form] = Form.useForm<LoginFormValues>();
  // 获取loadUserInfo函数
  const { loadUserInfo } = useLoadUserData();

  // 登录
  const { run: handleLogin, loading } = useRequest(
    async (username: string, password: string) => {
      const result = await loginService(username, password);
      return { result, username };
    },
    {
      manual: true,
      onSuccess(payload) {
        const { result, username } = payload;
        const { token } = result;
        setToken(token);
        message.success('登录成功');

        if (authBaseParam) {
          try {
            const authBaseUrl = new URL(authBaseParam);
            if (C_APP_ORIGIN) {
              const expectedOrigin = new URL(C_APP_ORIGIN).origin;
              if (authBaseUrl.origin !== expectedOrigin) {
                throw new Error('authBase 与配置的 C 端认证中心域名不一致');
              }
            }

            const ssoUrl = new URL('/api/auth/sso-callback', authBaseParam);
            ssoUrl.searchParams.set('token', token);
            ssoUrl.searchParams.set('username', username);
            ssoUrl.searchParams.set(
              'callbackUrl',
              callbackUrlParam || window.location.origin
            );
            window.location.href = ssoUrl.toString();
            return;
          } catch (error) {
            console.error(
              '[SSO] authBase 参数不合法，回退本地登录流程:',
              error
            );
          }
        }

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

  useEffect(() => {
    // 场景1：桥接命中，B 从 URL 消费 token 自动登录
    if (!tokenFromQuery) return;

    setToken(tokenFromQuery);
    void loadUserInfo();

    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('token');
    currentUrl.searchParams.delete('access_token');
    currentUrl.searchParams.delete('accessToken');
    currentUrl.searchParams.delete('username');
    currentUrl.searchParams.delete('userName');
    currentUrl.searchParams.delete('name');
    currentUrl.searchParams.delete('ssoBridge');
    currentUrl.searchParams.delete('ssoBridgeTried');
    window.history.replaceState({}, '', currentUrl.toString());
  }, [tokenFromQuery, loadUserInfo]);

  useEffect(() => {
    // 场景2：登录页若已有本地 token，先校验有效性（避免脏 token 阻塞桥接）
    if (tokenFromQuery) return;

    const localToken = getToken();
    if (!localToken) {
      setTokenCheckedAt(Date.now());
      return;
    }

    const verifyToken = async () => {
      try {
        await getUserInfoService();
        void loadUserInfo();
      } catch {
        removeToken();
        setTokenCheckedAt(Date.now());
      }
    };

    void verifyToken();
  }, [tokenFromQuery, loadUserInfo]);

  useEffect(() => {
    // 场景3：B 已登录 + 存在 callbackUrl/authBase，自动回调 C 端写会话
    const localToken = getToken();
    if (!localToken) return;
    if (!authBaseParam || !callbackUrlParam) return;
    if (tokenFromQuery) return;

    const onceKey = `__b_to_c_sso_once__:${window.location.search}`;
    if (sessionStorage.getItem(onceKey) === '1') return;
    sessionStorage.setItem(onceKey, '1');

    const syncToC = async () => {
      try {
        const userInfo = await getUserInfoService();
        const ssoUrl = new URL('/api/auth/sso-callback', authBaseParam);
        ssoUrl.searchParams.set('token', localToken);
        ssoUrl.searchParams.set('username', userInfo.username);
        ssoUrl.searchParams.set('callbackUrl', callbackUrlParam);
        window.location.href = ssoUrl.toString();
      } catch {
        // 读取用户失败则继续停留登录页，允许用户手动登录
      }
    };

    void syncToC();
  }, [authBaseParam, callbackUrlParam, tokenFromQuery]);

  useEffect(() => {
    // 场景4：B 未登录时，主动向 C 认证中心发起 sso-bridge 探测
    const localToken = getToken();
    if (localToken) return;
    if (!cAuthOrigin) return;
    if (tokenFromQuery) return;

    const now = Date.now();
    const lastTs = Number(
      sessionStorage.getItem(SSO_BRIDGE_LAST_TS_KEY) || '0'
    );
    if (now - lastTs < SSO_BRIDGE_COOLDOWN_MS) return;
    sessionStorage.setItem(SSO_BRIDGE_LAST_TS_KEY, String(now));

    const callback = new URL(window.location.href);
    callback.searchParams.delete('ssoBridgeTried');
    callback.searchParams.delete('ssoBridge');

    const bridgeUrl = new URL('/api/auth/sso-bridge', cAuthOrigin);
    bridgeUrl.searchParams.set('callbackUrl', callback.toString());
    window.location.href = bridgeUrl.toString();
  }, [cAuthOrigin, tokenFromQuery, tokenCheckedAt]);

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
