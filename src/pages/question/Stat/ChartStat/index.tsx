import { useRequest } from 'ahooks';
import { FC, useEffect, useState } from 'react';
import { getComponentStatStatService } from '../../../../services/stat';
import { Typography } from 'antd';
import { useParams } from 'react-router-dom';
import { getComponentConfigByType } from '../../../../components/QuestionComponents';

const { Title } = Typography;

type PropsType = {
  selectedComponentId: string;
  selectedComponentType: string;
};

const ChartStat: FC<PropsType> = (props) => {
  const { selectedComponentId, selectedComponentType } = props;
  const { id = '' } = useParams();
  const [stat, setStat] = useState([]);

  const { run } = useRequest(
    async (questionId, componentId) =>
      await getComponentStatStatService(questionId, componentId),
    {
      manual: true,
      onSuccess(res) {
        console.log('stat res: ', res);

        setStat(res.stat);
      },
    }
  );

  useEffect(() => {
    if (selectedComponentId) run(id, selectedComponentId);
  }, [id, selectedComponentId]);

  // 生成统计图表
  function getStatElem() {
    if (!selectedComponentId) return <div>未选中组件</div>;
    const { StatComponent } =
      getComponentConfigByType(selectedComponentType) || {};
    if (!StatComponent) return <div>该组件无统计图表</div>;
    return <StatComponent stat={stat} />;
  }

  return (
    <>
      <Title level={3}>图表统计</Title>
      <div>{getStatElem()}</div>
    </>
  );
};

export default ChartStat;
