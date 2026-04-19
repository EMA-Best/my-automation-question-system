import { FC } from 'react';
import QuestionCard from '../../../components/QuestionCard';
import styles from '../common.module.scss';
import { Typography, Empty, Spin } from 'antd';
import { useTitle } from 'ahooks';
import ListSearch from '../../../components/ListSearch';
import useLoadQuestionListData from '../../../hooks/useLoadQuestionListData';
import ListPage from '../../../components/ListPage';
import type { QuestionListItem } from '../../../services/question';
import useGetUserInfo from '../../../hooks/useGetUserInfo';
import AdminQuestions from '../AdminQuestions';

const { Title } = Typography;

const StarForUser: FC = () => {
  useTitle('星标问卷 | 小伦问卷 · 管理端');
  const { loading, data } = useLoadQuestionListData({ isStar: true });
  const { list, count } = data ?? { list: [], count: 0 };
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
          (list as QuestionListItem[]).map((item) => {
            return (
              <QuestionCard
                key={item._id}
                id={item._id}
                title={item.title}
                isPublished={item.isPublished}
                isStar={item.isStar}
                auditStatus={item.auditStatus}
                auditReason={item.auditReason}
                answerCount={item.answerCount}
                createdAt={item.createdAt}
              />
            );
          })}
      </div>
      <div className={styles.footer}>
        <ListPage total={count} />
      </div>
    </>
  );
};

const StarForAdmin: FC = () => {
  return (
    <AdminQuestions
      pageTitle="运营推荐 | 小伦问卷 · 管理端"
      headerTitle="运营推荐"
      defaultQuery={{ feature: 'featured' }}
    />
  );
};

const List: FC = () => {
  const { role } = useGetUserInfo();
  if (role === 'admin') return <StarForAdmin />;
  return <StarForUser />;
};

export default List;
