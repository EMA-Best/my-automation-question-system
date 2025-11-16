import { FC } from 'react';
import QuestionCard from '../../../components/QuestionCard';
import styles from '../common.module.scss';
import { Typography, Empty, Spin } from 'antd';
import { useTitle } from 'ahooks';
import ListSearch from '../../../components/ListSearch';
import useLoadQuestionListData from '../../../hooks/useLoadQuestionListData';
import ListPage from '../../../components/ListPage';

// const rawQuestionList = [
//   {
//     id: 'q1',
//     title: '问卷1',
//     isPublished: true,
//     isStar: true,
//     answerCount: 5,
//     createTime: '10月27日 21:36',
//   },
//   {
//     id: 'q2',
//     title: '问卷2',
//     isPublished: false,
//     isStar: true,
//     answerCount: 3,
//     createTime: '10月20日 10:15',
//   },
//   {
//     id: 'q3',
//     title: '问卷3',
//     isPublished: true,
//     isStar: true,
//     answerCount: 10,
//     createTime: '10月22日 22:00',
//   },
// ];

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
                createdTime={item.createTime}
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
