import { FC } from 'react';
import styles from '../index.module.scss';

interface Highlight {
  title: string;
  detail: string;
  evidenceQuestionIds: string[];
}

interface QuestionInsight {
  questionId: string;
  questionTitle: string;
  questionType: string;
  finding: string;
  evidence: string;
  chartHint?: string;
}

interface InsightsProps {
  highlights: Highlight[];
  questionInsights: QuestionInsight[];
}

const AIReportInsights: FC<InsightsProps> = ({
  highlights,
  questionInsights,
}) => {
  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>关键发现</div>
      <div className={styles.highlights}>
        {highlights.map((highlight, index) => (
          <div key={index} className={styles.highlightItem}>
            <div className={styles.title}>{highlight.title}</div>
            <div className={styles.detail}>{highlight.detail}</div>
            <div className={styles.evidence}>
              依据：题目 {highlight.evidenceQuestionIds.join(', ')}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.questionInsights}>
        <div className={styles.sectionTitle}>题目洞察</div>
        {questionInsights.map((insight, index) => (
          <div key={index} className={styles.insightItem}>
            <div className={styles.questionTitle}>{insight.questionTitle}</div>
            <div className={styles.questionType}>{insight.questionType}</div>
            <div className={styles.finding}>{insight.finding}</div>
            <div className={styles.evidence}>{insight.evidence}</div>
            {insight.chartHint && (
              <div className={styles.chartHint}>{insight.chartHint}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIReportInsights;
