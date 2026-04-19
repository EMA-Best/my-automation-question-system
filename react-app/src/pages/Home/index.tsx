import { FC, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './index.module.scss';
import { Typography, Button, Skeleton } from 'antd';
import { RocketOutlined, LinkOutlined } from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { routePath } from '../../router/index';
import { getHomeStatService } from '../../services/stat';
import { useTitle } from 'ahooks';

const { Title, Paragraph } = Typography;

const Home: FC = () => {
  // 设置页面标题
  useTitle('首页 | 小伦问卷 · 管理端');
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

  // C 端首页地址：优先读环境变量，未配置时回退本地默认地址
  const cAppOrigin =
    process.env.REACT_APP_C_APP_ORIGIN ?? 'http://localhost:3000';

  // 从 B 端首页进入 C 端首页（同窗口跳转，保持用户浏览链路）
  const toCHome = useCallback(() => {
    window.location.href = cAppOrigin;
  }, [cAppOrigin]);

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
        <div className={styles.actions}>
          <Button type="primary" icon={<RocketOutlined />} onClick={toManage}>
            开始使用
          </Button>

          {/* 次级入口：提供跳转到 C 端首页的便捷路径，白色实心样式醒目协调 */}
          <Button
            type="default"
            icon={<LinkOutlined />}
            onClick={toCHome}
            className={styles.secondaryBtn}
          >
            C端首页
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;
