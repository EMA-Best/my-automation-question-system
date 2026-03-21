import type { FC } from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { routePath } from '../../router';

const Forbidden: FC = () => {
  const navigate = useNavigate();

  const backToManage = () => {
    navigate(routePath.MANAGE_LIST);
  };

  return (
    <Result
      status="403"
      title="403"
      subTitle="你没有权限访问该页面"
      extra={
        <Button type="primary" onClick={backToManage}>
          返回问卷管理
        </Button>
      }
    />
  );
};

export default Forbidden;
