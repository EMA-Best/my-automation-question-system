import { FC } from 'react';
import { Button } from 'antd';
import styles from '../index.module.scss';

interface AIReportEmptyProps {
  onGenerate: () => void;
}

const AIReportEmpty: FC<AIReportEmptyProps> = ({ onGenerate }) => {
  return (
    <div className={styles.emptyContainer}>
      <div className={styles.emptyTitle}>AI 分析报告</div>
      <div className={styles.emptyDescription}>
        点击下方按钮生成针对当前问卷的 AI 分析报告，
        报告将基于已收集的答卷数据进行智能分析。
      </div>
      <Button type="primary" size="large" onClick={onGenerate}>
        生成报告
      </Button>
    </div>
  );
};

export default AIReportEmpty;
