import { useRequest } from 'ahooks';
import { Empty, Spin, Typography } from 'antd';
import { FC, useEffect, useMemo, useState } from 'react';
import { getComponentStatStatService } from '../../../../services/stat';
import { useParams } from 'react-router-dom';
import { getComponentConfigByType } from '../../../../components/QuestionComponents';
import styles from './index.module.scss';

type PropsType = {
  selectedComponentId: string;
  selectedComponentType: string;
};

type StatItem = {
  name: string;
  count: number;
};

type ComponentStatData = {
  stat: StatItem[];
};

const { Text, Title } = Typography;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseComponentStatData(value: unknown): ComponentStatData {
  if (!isRecord(value)) return { stat: [] };
  const { stat } = value;
  if (!Array.isArray(stat)) return { stat: [] };
  const parsed: StatItem[] = [];
  stat.forEach((item) => {
    if (!isRecord(item)) return;
    const { name, count } = item;
    if (typeof name !== 'string') return;
    if (typeof count !== 'number') return;
    parsed.push({ name, count });
  });
  return { stat: parsed };
}

const ChartStat: FC<PropsType> = (props) => {
  const { selectedComponentId, selectedComponentType } = props;
  const { id = '' } = useParams();
  const [stat, setStat] = useState<StatItem[]>([]);

  const componentConfig = useMemo(() => {
    if (!selectedComponentType) return null;
    return getComponentConfigByType(selectedComponentType) || null;
  }, [selectedComponentType]);

  const { run, loading } = useRequest(
    async (questionId: string, componentId: string) => {
      const res = await getComponentStatStatService(questionId, componentId);
      return parseComponentStatData(res);
    },
    {
      manual: true,
      onSuccess(res) {
        setStat(res.stat);
      },
    }
  );

  useEffect(() => {
    if (selectedComponentId) run(id, selectedComponentId);
  }, [id, selectedComponentId, run]);

  // 生成统计图表
  function getStatElem() {
    if (!selectedComponentId) {
      return <Empty description="请选择左侧的单选/多选题" />;
    }
    const StatComponent = componentConfig?.StatComponent;
    if (!StatComponent) {
      return <Empty description="该组件无图表统计" />;
    }
    if (loading) {
      return (
        <div className={styles.loadingWrap}>
          <Spin />
        </div>
      );
    }
    return <StatComponent stat={stat} />;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <Title level={5} className={styles.title}>
          图表统计
        </Title>
        <Text type="secondary" className={styles.subTitle}>
          {componentConfig
            ? `当前题型：${componentConfig.title}`
            : '点击左侧题目查看图表'}
        </Text>
      </div>

      <div className={styles.body}>
        <div className={styles.chartScroll}>
          <div className={styles.chartInner}>{getStatElem()}</div>
        </div>
      </div>
    </div>
  );
};

export default ChartStat;
