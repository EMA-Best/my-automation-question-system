import { FC, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './index.module.scss';
import { Typography, Button, Skeleton } from 'antd';
import { useRequest } from 'ahooks';
import { routePath } from '../../router/index';
import { getHomeStatService } from '../../services/stat';

const { Title, Paragraph } = Typography;

const Home: FC = () => {
  const navigate = useNavigate();

  const { data, loading } = useRequest(getHomeStatService);

  const statsText = useMemo(() => {
    const createdCount = data?.createdCount ?? 0;
    const publishedCount = data?.publishedCount ?? 0;
    const answerCount = data?.answerCount ?? 0;
    return `已累计创建问卷 ${createdCount} 份，发布问卷 ${publishedCount} 份，收到答卷 ${answerCount} 份`;
  }, [data?.answerCount, data?.createdCount, data?.publishedCount]);

  // 去问卷管理页面的回调
  const toManage = useCallback(() => {
    navigate(routePath.MANAGE_LIST);
  }, [navigate]);
  return (
    <div className={styles.container}>
      <div className={styles.info}>
        <Title>问卷调查 | 在线投票</Title>
        <Paragraph>
          {loading ? (
            <Skeleton
              active
              title={false}
              paragraph={{ rows: 1, width: 420 }}
            />
          ) : (
            statsText
          )}
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
