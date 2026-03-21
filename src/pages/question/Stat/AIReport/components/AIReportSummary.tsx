import { FC } from 'react';
import styles from '../index.module.scss';

interface SummaryProps {
  summary: {
    headline: string;
    brief: string;
  };
  sampleOverview: {
    totalAnswers: number;
    validAnswers: number;
    textCoverage: number;
  };
}

const AIReportSummary: FC<SummaryProps> = ({ summary, sampleOverview }) => {
  return (
    <div className={`${styles.section} ${styles.summary}`}>
      <div className={styles.sectionTitle}>执行摘要</div>
      <div className={styles.headline}>{summary.headline}</div>
      <div className={styles.brief}>{summary.brief}</div>
      <div className={styles.sampleOverview}>
        <div className={styles.item}>
          <div className={styles.value}>{sampleOverview.totalAnswers}</div>
          <div className={styles.label}>总样本数</div>
        </div>
        <div className={styles.item}>
          <div className={styles.value}>{sampleOverview.validAnswers}</div>
          <div className={styles.label}>有效样本</div>
        </div>
        <div className={styles.item}>
          <div className={styles.value}>{sampleOverview.textCoverage}%</div>
          <div className={styles.label}>文本覆盖率</div>
        </div>
      </div>
    </div>
  );
};

export default AIReportSummary;
