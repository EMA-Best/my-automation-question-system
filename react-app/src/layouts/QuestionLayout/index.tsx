import { FC } from 'react';
import { Outlet } from 'react-router-dom';

import { Layout, Spin } from 'antd';
import styles from './index.module.scss';
import Logo from '../../components/Logo';
import UserInfo from '../../components/UserInfo';
import useLoadUserData from '../../hooks/useLoadUserData';
import useNavPage from '../../hooks/useNavPage';

const { Header, Content } = Layout;

const QuestionLayout: FC = () => {
  // 从useLoadUserData中获取是否在等待用户数据加载完成
  const { waitingUserData } = useLoadUserData();
  // 导航守卫
  useNavPage(waitingUserData);
  return (
    <Layout>
      {/* 题目编辑/统计页统一导航头：左侧品牌，右侧个人信息 */}
      <Header className={styles.header}>
        <div className={styles.left}>
          <Logo />
        </div>
        <div className={styles.right}>
          <UserInfo />
        </div>
      </Header>

      <Layout className={styles.main}>
        <Content>
          {waitingUserData ? (
            <div style={{ textAlign: 'center', marginTop: '100px' }}>
              <Spin />
            </div>
          ) : (
            <Outlet />
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default QuestionLayout;
