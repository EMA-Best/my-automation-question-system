import { FC } from 'react';
import { Typography, Space, Button, Form, Input, message } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import { useTitle, useRequest } from 'ahooks';
import { Link } from 'react-router-dom';
import styles from './index.module.scss';
import { routePath } from '../../router/index';
import { registerService } from '../../services/user';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const Register: FC = () => {
  useTitle('小伦问卷 - 注册');
  const navigate = useNavigate();
  // 注册用户
  const { run: handleRegister } = useRequest(
    async (userInfo: any) => {
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

  // 表单提交成功回调
  const onFinish = (values: any) => {
    handleRegister(values); // 执行注册请求
  };
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
          <Title level={2}>注册新用户</Title>
        </Space>
      </div>
      {/* 表单部分 */}
      <div>
        <Form
          labelCol={{ span: 10 }}
          wrapperCol={{ span: 24 }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          style={{ width: 400 }}
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
                message: '长度必须在6到12个字符之间',
              },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={['password']} //依赖password字段 当password字段发生变化时，confirmPassword字段也会重新校验
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
            <Input.Password />
          </Form.Item>
          <Form.Item label="昵称" name="nickname">
            <Input />
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 10, span: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                注册
              </Button>
              <Link to={routePath.LOGIN}>已有账户，去登录</Link>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default Register;
