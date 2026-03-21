import { FC } from 'react';
import { Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { FormOutlined } from '@ant-design/icons';
import styles from './index.module.scss';
import useLoadUserData from '../../hooks/useLoadUserData';
import useNavPage from '../../hooks/useNavPage';

const AuthLayout: FC = () => {
  const { waitingUserData } = useLoadUserData();
  useNavPage(waitingUserData);

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.brand}>
          <div className={styles.brandTitle}>
            <FormOutlined className={styles.brandIcon} />
            <div className={styles.brandName}>小伦问卷</div>
          </div>
          <div className={styles.brandDesc}>
            更快创建问卷、更轻松配置题目。
            <br />
            登录后即可进入管理后台进行编辑与发布。
          </div>
        </div>

        <div className={styles.card}>
          {waitingUserData ? (
            <div className={styles.loading}>
              <Spin />
            </div>
          ) : (
            <Outlet />
          )}
        </div>

        <div className={styles.footer}>© 2025 - present 小伦问卷</div>
      </div>
    </div>
  );
};

export default AuthLayout;
