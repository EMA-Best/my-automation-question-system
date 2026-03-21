import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { routePath } from '../../router';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const toHome = () => {
    navigate(routePath.HOME);
  };
  return (
    <Result
      status="404"
      title="404"
      subTitle="抱歉，你访问的页面不存在！！！"
      extra={
        <Button type="primary" onClick={toHome}>
          返回首页
        </Button>
      }
    />
  );
};

export default NotFound;
