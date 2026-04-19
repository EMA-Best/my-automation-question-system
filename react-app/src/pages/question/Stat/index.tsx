import { FC, useState } from 'react';
import useLoadQuestionData from '../../../hooks/useLoadQuestionData';
import useGetPageInfo from '../../../hooks/useGetPageInfo';
import { Button, Result, Spin, Tabs, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTitle } from 'ahooks';
import { routePath } from '../../../router';
import styles from './index.module.scss';
import StatHeader from './StatHeader';
import ComponentList from './ComponentList';
import PageStat from './PageStat';
import ChartStat from './ChartStat';
import AIReport from './AIReport';

type RightViewKey = 'table' | 'chart' | 'ai-report';

const { Text } = Typography;

const Stat: FC = () => {
  const navigate = useNavigate();
  const { loading } = useLoadQuestionData();
  const { title, isPublished } = useGetPageInfo();

  // 设置页面标题
  useTitle(`问卷统计 - ${title} | 小伦问卷 · 管理端`);

  // loading部分
  const LoadingElem = (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <Spin />
    </div>
  );

  // 状态提升 selectedId type 通过props传给子组件
  const [selectedComponentId, setSelectedComponentId] = useState('');
  const [selectedComponentType, setSelectedComponentType] = useState('');

  const [rightView, setRightView] = useState<RightViewKey>('table');

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
              <Button
                type="primary"
                key="return"
                // 固定返回管理问卷列表，避免回到登录中转历史页
                onClick={() => navigate(routePath.MANAGE_LIST)}
              >
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
        <div className={styles.leftPanel}>
          <div className={styles.panelHeader}>问卷结构</div>
          <div className={styles.panelBody}>
            <ComponentList
              selectedComponentId={selectedComponentId}
              setSelectedComponentId={setSelectedComponentId}
              setSelectedComponentType={setSelectedComponentType}
            />
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.rightHeader}>
            <Tabs
              activeKey={rightView}
              onChange={(key) => setRightView(key as RightViewKey)}
              tabBarExtraContent={
                <Text type="secondary" className={styles.rightHint}>
                  点击单选/多选题可查看图表统计
                </Text>
              }
              items={[
                { key: 'table', label: '表格统计' },
                { key: 'chart', label: '图表统计' },
                { key: 'ai-report', label: 'AI分析报告' },
              ]}
            />
          </div>

          <div className={styles.panelBody}>
            {rightView === 'chart' ? (
              <ChartStat
                selectedComponentId={selectedComponentId}
                selectedComponentType={selectedComponentType}
              />
            ) : rightView === 'ai-report' ? (
              <AIReport />
            ) : (
              <PageStat
                selectedComponentId={selectedComponentId}
                setSelectedComponentId={setSelectedComponentId}
                setSelectedComponentType={setSelectedComponentType}
              />
            )}
          </div>
        </div>
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
