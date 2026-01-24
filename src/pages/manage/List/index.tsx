import { FC, useState, useEffect, useRef, useMemo } from 'react';
import QuestionCard from '../../../components/QuestionCard';
import styles from '../common.module.scss';
import { Typography, Spin, Empty } from 'antd';
import { useTitle, useDebounceFn, useRequest } from 'ahooks';
import ListSearch from '../../../components/ListSearch';
import { useSearchParams } from 'react-router-dom';
import { getQuestionListService } from '../../../services/question';
import type { QuestionListItem } from '../../../services/question';
import { LIST_SEARCH_PARAM_KEY } from '../../../constant/index';
import useGetUserInfo from '../../../hooks/useGetUserInfo';
import AdminQuestions from '../AdminQuestions';

const { Title } = Typography;

const ListForUser: FC = () => {
  useTitle('小伦问卷 - 全部问卷');
  // const [questionList] = useState(rawQuestionList);

  // 当前不加这个状态会在一开始进入页面，出先暂无数据的bug，因为加载数据做了防抖，有延迟
  // 所以需要定义这个状态
  const [started, setStarted] = useState(false); // 是否已经开始加载数据
  const [pageNum, setPageNum] = useState(1); // 当前组件需要的pageNum参数，但不在url中
  const [lists, setLists] = useState<QuestionListItem[]>([]); // 累计的问卷列表数据
  const [total, setTotal] = useState(0); // 总问卷数量
  const haveMoreData = total > lists.length; // 是否还有更多数据可以加载
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get(LIST_SEARCH_PARAM_KEY) || '';
  // 添加加载状态锁，防止重复加载
  // const [isLoadingMore, setIsLoadingMore] = useState(true);

  // 当keyword变化时，重置信息
  useEffect(() => {
    setStarted(false);
    setPageNum(1);
    setLists([]);
    setTotal(0);
  }, [keyword]);

  // 真正加载
  const { run: loadMore, loading } = useRequest(
    async () => {
      const data = await getQuestionListService({
        pageNum,
        pageSize: 10,
        keyword: searchParams.get(LIST_SEARCH_PARAM_KEY) || '',
      });
      return data;
    },
    {
      manual: true, // 手动触发加载
      onSuccess: (result) => {
        console.log('result: ', result);
        const { list = [], count = 0 } = result;
        setLists((prev) => prev.concat(list)); // 累计
        setTotal(count);
        setPageNum(pageNum + 1);
      },
    }
  );

  const containerRef = useRef<HTMLDivElement>(null);
  // 重命名run为tryLoadMore，因为它是尝试加载更多数据的函数
  // 防抖：用户停止滚动500ms后，才触发加载更多数据
  const { run: tryLoadMore } = useDebounceFn(
    () => {
      // 如果正在加载中或没有更多数据，直接返回
      // if (isLoadingMore || !haveMoreData) return;

      const elem = containerRef.current;
      if (elem == null) return;

      // 获取元素的位置信息
      const domRect = elem.getBoundingClientRect();
      if (domRect == null) return;

      const { bottom } = domRect;

      console.log('bottom: ', bottom);
      console.log('window.innerHeight: ', window.innerHeight);

      if (bottom <= window.innerHeight) {
        loadMore();
        setStarted(true); // 加载数据后，设置为true
        console.log('执行加载');
      }
    },
    {
      wait: 1000,
    }
  );

  // 当页面加载或者url参数变化时(keyword变化)，触发加载
  useEffect(() => {
    tryLoadMore();
  }, [searchParams]);

  // 当页面滚动时，要尝试加载更多
  useEffect(() => {
    console.log('haveMoreData: ', haveMoreData);
    if (haveMoreData) {
      window.addEventListener('scroll', tryLoadMore);
    }
    return () => {
      // 组件卸载时，移除事件监听
      window.removeEventListener('scroll', tryLoadMore);
    };
  }, [searchParams, haveMoreData]);

  // 加载更多模块的JSX
  const LoadMoreContentElem = useMemo(() => {
    return () => {
      if (!started || loading) return <Spin />;
      if (total === 0) return <Empty description="暂无问卷" />;
      if (!haveMoreData) return <span>没有更多了...</span>;
      return <span>开始加载下一页</span>;
    };
  }, [started, loading, haveMoreData, total]);

  return (
    <>
      <div className={styles.header}>
        <div className={styles.left}>
          <Title level={3}>全部问卷</Title>
        </div>
        <div className={styles.right}>
          <ListSearch />
        </div>
      </div>
      <div className={styles.content}>
        {/* 问卷列表 */}
        {lists.length > 0 &&
          lists.map((item) => {
            const { _id, title, isPublished, isStar, answerCount, createdAt } =
              item;
            return (
              <QuestionCard
                key={_id}
                id={_id}
                title={title}
                isPublished={isPublished}
                isStar={isStar}
                auditStatus={item.auditStatus}
                auditReason={item.auditReason}
                answerCount={answerCount}
                createdAt={createdAt}
              />
            );
          })}
      </div>
      <div className={styles.footer}>
        <div ref={containerRef}>{LoadMoreContentElem()}</div>
      </div>
    </>
  );
};

const ListForAdmin: FC = () => {
  return (
    <AdminQuestions pageTitle="小伦问卷 - 全部问卷" headerTitle="全部问卷" />
  );
};

const List: FC = () => {
  const { role } = useGetUserInfo();
  if (role === 'admin') return <ListForAdmin />;
  return <ListForUser />;
};

export default List;
