import { FC, useState } from 'react';
import useLoadQuestionData from '../../../hooks/useLoadQuestionData';
import useGetPageInfo from '../../../hooks/useGetPageInfo';
import { Button, Result, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTitle } from 'ahooks';
import styles from './index.module.scss';
import StatHeader from './StatHeader';
import ComponentList from './ComponentList';

const Stat: FC = () => {
  const navigate = useNavigate();
  const { loading } = useLoadQuestionData();
  const { title, isPublished } = useGetPageInfo();

  // 设置页面标题
  useTitle(`问卷统计-${title}`);

  // loading部分
  const LoadingElem = (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <Spin />
    </div>
  );

  // 状态提升 selectedId type 通过props传给子组件
  const [selectedComponentId, setSelectedComponentId] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [selectedComponentType, setSelectedComponentType] = useState('');

  // 内容部分
  const getContentElem = () => {
    // 如果问卷没有发布
    if (typeof isPublished === 'boolean' && !isPublished) {
      return (
        <div style={{ flex: '1' }}>
          <Result
            status="warning"
            title="该问卷还未发布！"
            extra={[
              <Button type="primary" key="return" onClick={() => navigate(-1)}>
                返回
              </Button>,
            ]}
          />
        </div>
      );
    }
    // 如果问卷已发布
    return (
      <>
        <div className={styles.left}>
          <ComponentList
            selectedComponentId={selectedComponentId}
            setSelectedComponentId={setSelectedComponentId}
            setSelectedComponentType={setSelectedComponentType}
          />
        </div>
        <div className={styles.main}>中间</div>
        <div className={styles.right}>右侧</div>
      </>
    );
  };

  return (
    <div className={styles.container}>
      <StatHeader />
      <div className={styles['content-wrapper']}>
        {loading && LoadingElem}
        {!loading && <div className={styles.content}>{getContentElem()}</div>}
      </div>
    </div>
  );
};

export default Stat;
