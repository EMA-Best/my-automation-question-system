import { FC, useCallback, useMemo } from 'react';
import { QuestionRadioStatPropsType } from './interface';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

function format(num: number) {
  return (num * 100).toFixed(2);
}

const COLORS = [
  '#1677ff',
  '#2f54eb',
  '#722ed1',
  '#13c2c2',
  '#52c41a',
  '#faad14',
  '#fa541c',
  '#ff4d4f',
];

type PieStatDatum = {
  name: string;
  count: number;
};

const StatComponent: FC<QuestionRadioStatPropsType> = ({ stat = [] }) => {
  const sum = useMemo(() => {
    let s = 0;
    stat.forEach((i) => (s += i.count));
    return s;
  }, [stat]);

  const data = useMemo(() => {
    return (stat as PieStatDatum[])
      .filter((i) => i && typeof i.count === 'number' && i.count > 0)
      .map((i) => ({ name: i.name, count: i.count }));
  }, [stat]);

  const renderLabel = useCallback(
    (params: { name?: string; value?: number; percent?: number }) => {
      const { name, percent } = params;
      const safeName = typeof name === 'string' ? name : '';
      const safePercent = typeof percent === 'number' ? percent : 0;
      if (!safeName) return '';
      if (safePercent < 0.06) return '';
      const shortName =
        safeName.length > 10 ? `${safeName.slice(0, 10)}…` : safeName;
      return `${shortName} ${format(safePercent)}%`;
    },
    []
  );

  const tooltipFormatter = useCallback(
    (value: unknown, _name: unknown, payload?: unknown) => {
      const count = typeof value === 'number' ? value : 0;
      const label =
        payload &&
        typeof payload === 'object' &&
        payload !== null &&
        'name' in payload &&
        typeof (payload as { name?: unknown }).name === 'string'
          ? (payload as { name: string }).name
          : '';
      const p = sum > 0 ? count / sum : 0;
      return [`${count}（${format(p)}%）`, label];
    },
    [sum]
  );

  const legendFormatter = useCallback((value: unknown) => {
    const text = typeof value === 'string' ? value : '';
    return text.length > 16 ? `${text.slice(0, 16)}…` : text;
  }, []);

  if (sum <= 0 || data.length === 0) {
    return (
      <div style={{ padding: '12px 16px', color: 'rgba(0,0,0,0.45)' }}>
        暂无统计数据
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 360 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            dataKey="count"
            data={data}
            cx="50%"
            cy="46%"
            innerRadius={46}
            outerRadius={92}
            paddingAngle={2}
            cornerRadius={6}
            stroke="#fff"
            strokeWidth={2}
            labelLine={false}
            label={renderLabel}
          >
            {data.map((i, index) => (
              <Cell
                key={`${i.name}_${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={tooltipFormatter}
            contentStyle={{ borderRadius: 10, borderColor: 'rgba(0,0,0,0.08)' }}
          />
          <Legend
            verticalAlign="bottom"
            height={42}
            formatter={legendFormatter}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatComponent;
