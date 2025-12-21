import { FC } from 'react';
import QuestionCard from '../../../components/QuestionCard';
import styles from '../common.module.scss';
import { Typography, Empty, Spin } from 'antd';
import { useTitle } from 'ahooks';
import ListSearch from '../../../components/ListSearch';
import useLoadQuestionListData from '../../../hooks/useLoadQuestionListData';
import ListPage from '../../../components/ListPage';

const { Title } = Typography;

const List: FC = () => {
  useTitle('小伦问卷 - 星标问卷');
  const { loading, data } = useLoadQuestionListData({ isStar: true });
  const { list = [], total = 0 } = data || {};
  // console.log('星标问卷列表:', list, total);
  return (
    <>
      <div className={styles.header}>
        <div className={styles.left}>
          <Title level={3}>星标问卷</Title>
        </div>
        <div className={styles.right}>
          <ListSearch />
        </div>
      </div>
      <div className={styles.content}>
        {loading && (
          <div style={{ textAlign: 'center' }}>
            <Spin />
          </div>
        )}
        {/* 问卷列表 */}
        {!loading && list.length === 0 && <Empty description="暂无星标问卷" />}
        {list.length > 0 &&
          list.map((item: any) => {
            return (
              <QuestionCard
                key={item.id}
                id={item.id}
                title={item.title}
                isPublished={item.isPublished}
                isStar={item.isStar}
                answerCount={item.answerCount}
                createdAt={item.createdAt}
              />
            );
          })}
      </div>
      <div className={styles.footer}>
        <ListPage total={total} />
      </div>
    </>
  );
};

export default List;
