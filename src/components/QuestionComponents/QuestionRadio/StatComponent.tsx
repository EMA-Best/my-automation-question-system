import { FC, useMemo } from 'react';
import { QuestionRadioStatPropsType } from './interface';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

function format(num: number) {
  return (num * 100).toFixed(2);
}

const StatComponent: FC<QuestionRadioStatPropsType> = ({ stat = [] }) => {
  const sum = useMemo(() => {
    let s = 0;
    stat.forEach((i) => (s += i.count));
    return s;
  }, [stat]);

  //   console.log('sum：', sum);

  return (
    <div style={{ width: '300px', height: '400px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            dataKey="count"
            data={stat}
            cx="50%"
            cy="50%"
            outerRadius={50}
            fill="#8884d8"
            label={({ name, value }) => `${name}:${format(value / sum)}%`}
          >
            {stat.map((i, index) => {
              return <Cell key={index} />;
            })}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatComponent;
