import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './index.module.scss';
import { Typography, Button } from 'antd';
import { routePath } from '../../router/index';

const { Title, Paragraph } = Typography;

const Home: FC = () => {
  const navigate = useNavigate();

  // 去问卷管理页面的回调
  const toManage = () => {
    navigate(routePath.MANAGE_LIST);
  };
  return (
    <div className={styles.container}>
      <div className={styles.info}>
        <Title>问卷调查 | 在线投票</Title>
        <Paragraph>
          已累计创建问卷 100 份，发布问卷 90 份，收到答卷 980 份
        </Paragraph>
        <div>
          <Button type="primary" onClick={toManage}>
            开始使用
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
