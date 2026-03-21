import { FC } from 'react';
import { Button, Select } from 'antd';
import styles from '../index.module.scss';

type AIReportState = 'idle' | 'generating' | 'success' | 'failed';
type AIReportMode = 'quick' | 'standard' | 'deep';

interface AIReportToolbarProps {
  state: AIReportState;
  mode: AIReportMode;
  onModeChange: (mode: AIReportMode) => void;
  onGenerate: () => void;
  onRegenerate: () => void;
  onExport: () => void;
  canExport: boolean;
}

const AIReportToolbar: FC<AIReportToolbarProps> = ({
  state,
  mode,
  onModeChange,
  onGenerate,
  onRegenerate,
  onExport,
  canExport,
}) => {
  const getStatusLabel = (state: AIReportState) => {
    switch (state) {
      case 'idle':
        return '未生成';
      case 'generating':
        return '生成中';
      case 'success':
        return '已完成';
      case 'failed':
        return '失败';
      default:
        return '未知';
    }
  };

  return (
    <div className={styles.toolbar}>
      <div className={styles.buttons}>
        <Select
          value={mode}
          disabled={state === 'generating'}
          onChange={(value: AIReportMode) => onModeChange(value)}
          options={[
            { value: 'quick', label: '快速模式' },
            { value: 'standard', label: '标准模式' },
            { value: 'deep', label: '深度模式' },
          ]}
          style={{ width: 120 }}
        />
        {state === 'idle' && (
          <Button type="primary" onClick={onGenerate}>
            生成报告
          </Button>
        )}
        {state === 'success' && (
          <Button onClick={onRegenerate}>重新生成</Button>
        )}
        <Button
          onClick={onExport}
          disabled={state === 'generating' || !canExport}
        >
          导出报告
        </Button>
      </div>
      <div className={styles.status}>
        <span className={styles.statusLabel}>状态：</span>
        <span className={`${styles.statusBadge} ${styles[state]}`}>
          {getStatusLabel(state)}
        </span>
      </div>
    </div>
  );
};

export default AIReportToolbar;
