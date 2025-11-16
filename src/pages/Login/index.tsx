import { FC, useEffect } from 'react';
import {
  Typography,
  Space,
  Button,
  Form,
  Input,
  Checkbox,
  message,
} from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import { useTitle, useRequest } from 'ahooks';
import { Link, useNavigate } from 'react-router-dom';
import styles from './index.module.scss';
import { routePath } from '../../router/index';
import { loginService } from '../../services/user';
import { setToken } from '../../utils/user-token';

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

const Login: FC = () => {
  useTitle('小伦问卷 - 登录');
  // antd表单实例 用于设置表单默认值
  const [form] = Form.useForm();
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
  }, []);
  // 表单提交成功回调
  const onFinish = (values: any) => {
    // console.log(values);
    const { username, password, remember } = values;
    handleLogin(username, password); // 执行登录请求
    // 如果勾选了记住密码，将用户信息存储在localStorage中
    if (remember) {
      rememberUser(username, password);
    } else {
      // 如果没有勾选记住密码，删除localStorage中的用户信息
      forgetUser();
    }
  };

  const navigate = useNavigate();
  // 登录
  const { run: handleLogin } = useRequest(
    async (username: string, password: string) => {
      const result = await loginService(username, password);
      return result;
    },
    {
      manual: true,
      onSuccess(result) {
        const { token } = result;
        // console.log('登录成功后返回的token:', token);

        // 登录成功后，将token存储在localStorage中
        setToken(token);
        message.success('登录成功');
        // 登录成功后，跳转到首页
        navigate(routePath.MANAGE_LIST);
      },
    }
  );

  // 表单提交失败回调
  const onFinishFailed = (errorInfo: any) => {
    console.log(errorInfo);
  };

  return (
    <div className={styles.container}>
      {/* 标题部分 */}
      <div className={styles.title}>
        <Space>
          <Title level={2}>
            <UserAddOutlined />
          </Title>
          <Title level={2}>用户登录</Title>
        </Space>
      </div>
      {/* 表单部分 */}
      <div>
        {/* initialValues设置表单默认值 form属性可以设置表单初始值默认值*/}
        <Form
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          initialValues={{ remember: true }}
          form={form}
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
            <Input />
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
            <Input.Password />
          </Form.Item>
          {/* valuePropName指定checkbox要提交的value值 */}
          <Form.Item
            name="remember"
            valuePropName="checked"
            wrapperCol={{ offset: 6, span: 18 }}
          >
            <Checkbox>记住密码</Checkbox>
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                登录
              </Button>
              <Link to={routePath.REGISTER}>注册新用户</Link>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Login;
