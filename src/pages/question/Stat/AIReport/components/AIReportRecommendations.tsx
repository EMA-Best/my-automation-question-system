import { FC } from 'react';
import styles from '../index.module.scss';

interface RecommendationsProps {
  recommendations: string[];
}

const AIReportRecommendations: FC<RecommendationsProps> = ({
  recommendations,
}) => {
  return (
    <div className={`${styles.section} ${styles.recommendations}`}>
      <div className={styles.sectionTitle}>行动建议</div>
      {recommendations.map((recommendation, index) => (
        <div key={index} className={styles.recommendationItem}>
          {recommendation}
        </div>
      ))}
    </div>
  );
};

export default AIReportRecommendations;
