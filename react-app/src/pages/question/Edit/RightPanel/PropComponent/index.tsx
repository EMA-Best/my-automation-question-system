import { FC } from 'react';
import useGetComponentInfo from '../../../../../hooks/useGetComponentInfo';
import {
  ComponentPropsType,
  getComponentConfigByType,
} from '../../../../../components/QuestionComponents';
import { useDispatch } from 'react-redux';
import { changeComponentProps } from '../../../../../store/componentsReducer';

const NoProp: FC = () => {
  return <div style={{ textAlign: 'center' }}>未选中组件</div>;
};

const PropComponent: FC = () => {
  const dispatch = useDispatch();
  // 获取选中的组件
  const { selectedComponent } = useGetComponentInfo();
  if (selectedComponent == null) return <NoProp />;
  const { type, props, isLocked, isHidden } = selectedComponent;
  // 根据组件类型获取组件配置
  const componentConf = getComponentConfigByType(type);
  if (componentConf == null) return <NoProp />;

  // 处理属性变化
  function changeProps(newProps: ComponentPropsType) {
    if (selectedComponent == null) return;
    const { fe_id } = selectedComponent;
    dispatch(changeComponentProps({ fe_id, newProps }));
  }

  // 从组件配置中获取属性组件
  const { PropComponent } = componentConf;
  return (
    <PropComponent
      {...props}
      onChange={changeProps}
      disabled={isLocked || isHidden}
    />
  );
};

export default PropComponent;
