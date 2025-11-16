import { FC } from 'react';
import { Outlet } from 'react-router-dom';

import { Spin } from 'antd';
import useLoadUserData from '../../hooks/useLoadUserData';
import useNavPage from '../../hooks/useNavPage';

const QuestionLayout: FC = () => {
  // 从useLoadUserData中获取是否在等待用户数据加载完成
  const { waitingUserData } = useLoadUserData();
  // 导航守卫
  useNavPage(waitingUserData);
  return (
    <>
      <div>
        {waitingUserData ? (
          <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <Spin />
          </div>
        ) : (
          <Outlet />
        )}
      </div>
    </>
  );
};

export default QuestionLayout;
