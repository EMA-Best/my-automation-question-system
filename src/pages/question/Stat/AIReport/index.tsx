import { FC, useState, useEffect } from 'react';
import { Spin, Alert, message } from 'antd';
import { useParams } from 'react-router-dom';
import styles from './index.module.scss';
import AIReportToolbar from './components/AIReportToolbar';
import AIReportSummary from './components/AIReportSummary';
import AIReportInsights from './components/AIReportInsights';
import AIReportRisks from './components/AIReportRisks';
import AIReportRecommendations from './components/AIReportRecommendations';
import AIReportEmpty from './components/AIReportEmpty';
import {
  getQuestionAIReportLatestService,
  generateQuestionAIReportService,
  getQuestionAIReportTaskStatusService,
} from '../../../../services/stat';

type AIReportState = 'idle' | 'generating' | 'success' | 'failed';
type AIReportMode = 'quick' | 'standard' | 'deep';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizeQuestionTitle = (value: string) =>
  value.replace(/^\s*\d+\s*[.。．、]\s*/, '').trim();

type AIReportData = {
  summary: {
    headline: string;
    brief: string;
  };
  highlights: Array<{
    title: string;
    detail: string;
    evidenceQuestionIds: string[];
  }>;
  sampleOverview: {
    totalAnswers: number;
    validAnswers: number;
    textCoverage: number;
  };
  questionInsights: Array<{
    questionId: string;
    questionTitle: string;
    questionType: string;
    finding: string;
    evidence: string;
    chartHint?: string;
  }>;
  risks: string[];
  recommendations: string[];
  confidenceNotes: string[];
};

const AIReport: FC = () => {
  const { id: questionId } = useParams<{ id: string }>();
  const [state, setState] = useState<AIReportState>('idle');
  const [report, setReport] = useState<AIReportData | null>(null);
  const [error, setError] = useState<string>('');
  const [mode, setMode] = useState<AIReportMode>('standard');

  const buildReportPrintHtml = (data: AIReportData) => {
    const highlightsHtml = (data.highlights || [])
      .map(
        (item, idx) => `
          <div class="item">
            <div class="item-title">${idx + 1}. ${escapeHtml(item.title || '-')}</div>
            <div>详情：${escapeHtml(item.detail || '-')}</div>
            <div>依据题目：${escapeHtml((item.evidenceQuestionIds || []).join(', ') || '-')}</div>
          </div>
        `
      )
      .join('');

    const insightsHtml = (data.questionInsights || [])
      .map(
        (item, idx) => `
          <div class="item">
            <div class="item-title">${idx + 1}. ${escapeHtml(normalizeQuestionTitle(item.questionTitle || '-'))}</div>
            <div>发现：${escapeHtml(item.finding || '-')}</div>
            <div>依据：${escapeHtml(item.evidence || '-')}</div>
            <div>图表提示：${escapeHtml(item.chartHint || '-')}</div>
          </div>
        `
      )
      .join('');

    const risksHtml = (data.risks || [])
      .map((item) => `<li>${escapeHtml(item || '-')}</li>`)
      .join('');

    const recommendationsHtml = (data.recommendations || [])
      .map((item) => `<li>${escapeHtml(item || '-')}</li>`)
      .join('');

    const confidenceNotesHtml = (data.confidenceNotes || [])
      .map((item) => `<li>${escapeHtml(item || '-')}</li>`)
      .join('');

    return `
      <!doctype html>
      <html lang="zh-CN">
        <head>
          <meta charset="UTF-8" />
          <title>AI 分析报告</title>
          <style>
            @page { size: A4; margin: 14mm; }
            body {
              font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", "SimSun", sans-serif;
              color: #222;
              line-height: 1.6;
              font-size: 12px;
            }
            h1 { font-size: 24px; margin: 0 0 8px; }
            h2 { font-size: 18px; margin: 20px 0 8px; border-left: 4px solid #1677ff; padding-left: 8px; }
            .meta { color: #666; margin-bottom: 4px; }
            .block { margin: 8px 0; }
            .item { margin: 10px 0; padding: 8px 10px; background: #f7f9fc; border-radius: 6px; }
            .item-title { font-weight: 700; margin-bottom: 4px; }
            ol { margin: 6px 0 0 18px; padding: 0; }
            li { margin: 4px 0; }
          </style>
        </head>
        <body>
          <h1>AI 分析报告</h1>
          <div class="meta">问卷 ID：${escapeHtml(questionId || 'unknown')}</div>
          <div class="meta">导出时间：${escapeHtml(new Date().toLocaleString())}</div>

          <h2>1. 执行摘要</h2>
          <div class="block"><strong>标题：</strong>${escapeHtml(data.summary?.headline || '-')}</div>
          <div class="block"><strong>内容：</strong>${escapeHtml(data.summary?.brief || '-')}</div>

          <h2>2. 样本概览</h2>
          <div class="block">总样本数：${data.sampleOverview?.totalAnswers ?? 0}</div>
          <div class="block">有效样本：${data.sampleOverview?.validAnswers ?? 0}</div>
          <div class="block">文本覆盖率：${data.sampleOverview?.textCoverage ?? 0}%</div>

          <h2>3. 关键发现</h2>
          ${highlightsHtml || '<div class="block">暂无</div>'}

          <h2>4. 题目洞察</h2>
          ${insightsHtml || '<div class="block">暂无</div>'}

          <h2>5. 风险提示</h2>
          ${risksHtml ? `<ol>${risksHtml}</ol>` : '<div class="block">暂无</div>'}

          <h2>6. 行动建议</h2>
          ${recommendationsHtml ? `<ol>${recommendationsHtml}</ol>` : '<div class="block">暂无</div>'}

          <h2>7. 置信度说明</h2>
          ${confidenceNotesHtml ? `<ol>${confidenceNotesHtml}</ol>` : '<div class="block">暂无</div>'}
        </body>
      </html>
    `;
  };

  const handleExportReport = async () => {
    if (!report) {
      message.warning('当前没有可导出的报告');
      return;
    }

    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc || !iframe.contentWindow) {
        document.body.removeChild(iframe);
        message.error('打印环境初始化失败，请重试');
        return;
      }

      doc.open();
      doc.write(buildReportPrintHtml(report));
      doc.close();

      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        // 给浏览器一点时间触发打印，再清理节点
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 1000);
      };

      message.success('已唤起打印，请选择“另存为 PDF”');
    } catch (e) {
      console.error('导出报告失败:', e);
      message.error('导出失败，请重试');
    }
  };

  // 加载最新报告
  const loadLatestReport = async () => {
    if (!questionId) return;
    try {
      const data = await getQuestionAIReportLatestService(questionId);
      if (data) {
        setReport(data);
        setState('success');
      } else {
        setState('idle');
      }
    } catch (err) {
      console.error('Failed to load latest report:', err);
      setState('idle');
    }
  };

  // 生成报告
  const handleGenerateReport = async () => {
    if (!questionId) return;
    try {
      setState('generating');
      setError('');
      const task = await generateQuestionAIReportService(questionId, {
        mode,
        timeRange: 'all',
        includeTextAnswers: true,
        maxAnswers: mode === 'quick' ? 80 : mode === 'deep' ? 300 : 180,
      });

      const maxAttempts = 90;
      const intervalMs = 2000;

      let reportData: AIReportData | null = null;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const statusData = await getQuestionAIReportTaskStatusService(
          questionId,
          task.taskId
        );

        if (statusData.status === 'succeeded') {
          reportData = statusData.report as AIReportData;
          break;
        }

        if (statusData.status === 'failed') {
          throw new Error(statusData.errorMessage || '生成任务失败');
        }

        await sleep(intervalMs);
      }

      if (!reportData) {
        throw new Error('生成超时，请稍后重试');
      }

      setReport(reportData);
      setState('success');
    } catch (err) {
      console.error('Failed to generate report:', err);
      const errorMessage =
        err instanceof Error ? err.message : '生成报告失败，请重试';
      setError(errorMessage);
      setState('failed');
    }
  };

  // 重新生成报告
  const handleRegenerateReport = async () => {
    await handleGenerateReport();
  };

  // 初始加载
  useEffect(() => {
    loadLatestReport();
  }, [questionId]);

  // 渲染不同状态的内容
  const renderContent = () => {
    switch (state) {
      case 'idle':
        return <AIReportEmpty onGenerate={handleGenerateReport} />;
      case 'generating':
        return (
          <div className={styles.loadingContainer}>
            <Spin size="large" tip="正在生成报告..." />
          </div>
        );
      case 'failed':
        return (
          <Alert
            message="生成失败"
            description={error || '生成报告时发生错误，请重试'}
            type="error"
            showIcon
            action={
              <button
                className={styles.retryButton}
                onClick={handleRegenerateReport}
              >
                重试
              </button>
            }
          />
        );
      case 'success':
        if (!report) return <AIReportEmpty onGenerate={handleGenerateReport} />;
        return (
          <>
            <AIReportSummary
              summary={report.summary}
              sampleOverview={report.sampleOverview}
            />
            <AIReportInsights
              highlights={report.highlights}
              questionInsights={report.questionInsights}
            />
            <AIReportRisks risks={report.risks} />
            <AIReportRecommendations recommendations={report.recommendations} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <AIReportToolbar
        state={state}
        mode={mode}
        onModeChange={setMode}
        onGenerate={handleGenerateReport}
        onRegenerate={handleRegenerateReport}
        onExport={handleExportReport}
        canExport={!!report}
      />
      <div className={styles.content}>{renderContent()}</div>
    </div>
  );
};

export default AIReport;
