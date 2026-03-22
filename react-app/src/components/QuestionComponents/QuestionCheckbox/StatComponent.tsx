import { FC, useCallback, useMemo } from 'react';
import {
  Bar,
  CartesianGrid,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { QuestionCheckboxStatPropsType } from './interface';

const BAR_COLOR = '#1677ff';

type BarDatum = {
  name: string;
  count: number;
};

function toLines(input: string): string[] {
  const text = input.trim();
  if (!text) return [''];
  const parts = text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    // 最多两行，避免 y 轴高度爆炸
    const first = parts.slice(0, 2).join(', ');
    const rest = parts.slice(2).join(', ');
    const firstLine = first.length > 16 ? `${first.slice(0, 16)}…` : first;
    if (!rest) return [firstLine];
    const secondLine = rest.length > 16 ? `${rest.slice(0, 16)}…` : rest;
    return [firstLine, secondLine];
  }

  if (text.length <= 18) return [text];
  return [`${text.slice(0, 18)}…`];
}

type YAxisTickProps = {
  x?: number | string;
  y?: number | string;
  payload?: { value?: unknown };
};

const StatComponent: FC<QuestionCheckboxStatPropsType> = ({ stat }) => {
  const data = useMemo(() => {
    return (stat as BarDatum[])
      .filter((i) => i && typeof i.count === 'number')
      .map((i) => ({ name: i.name, count: i.count }))
      .sort((a, b) => b.count - a.count);
  }, [stat]);

  const height = useMemo(() => {
    const rows = Math.max(3, data.length);
    return Math.min(520, 92 + rows * 44);
  }, [data.length]);

  const renderYAxisTick = useCallback((props: YAxisTickProps) => {
    const { x = 0, y = 0, payload } = props;
    const raw = payload?.value;
    const label = typeof raw === 'string' ? raw : String(raw ?? '');
    const lines = toLines(label);

    return (
      <g transform={`translate(${x},${y})`}>
        <title>{label}</title>
        {lines.map((line, idx) => (
          <text
            key={`${label}_${idx}`}
            x={0}
            y={idx * 14}
            dy={4}
            textAnchor="end"
            fill="rgba(0,0,0,0.65)"
            fontSize={12}
          >
            {line}
          </text>
        ))}
      </g>
    );
  }, []);

  const tooltipFormatter = useCallback((value: unknown) => {
    const count = typeof value === 'number' ? value : 0;
    return [`${count}`, '数量'];
  }, []);

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '12px 16px', color: 'rgba(0,0,0,0.45)' }}>
        暂无统计数据
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{
            top: 12,
            right: 24,
            left: 12,
            bottom: 8,
          }}
          barCategoryGap={10}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
          <XAxis
            type="number"
            tick={{ fill: 'rgba(0,0,0,0.65)', fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={160}
            tickLine={false}
            axisLine={false}
            tick={renderYAxisTick}
          />
          <Tooltip
            formatter={tooltipFormatter}
            contentStyle={{ borderRadius: 10, borderColor: 'rgba(0,0,0,0.08)' }}
            cursor={{ fill: 'rgba(22, 119, 255, 0.08)' }}
          />
          <Bar
            dataKey="count"
            fill={BAR_COLOR}
            radius={[0, 8, 8, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatComponent;
