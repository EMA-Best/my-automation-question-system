import { FC } from 'react';
import styles from '../index.module.scss';

interface RisksProps {
  risks: string[];
}

const AIReportRisks: FC<RisksProps> = ({ risks }) => {
  return (
    <div className={`${styles.section} ${styles.risks}`}>
      <div className={styles.sectionTitle}>风险提示</div>
      {risks.map((risk, index) => (
        <div key={index} className={styles.riskItem}>
          {risk}
        </div>
      ))}
    </div>
  );
};

export default AIReportRisks;
