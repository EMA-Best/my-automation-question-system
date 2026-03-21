/**
 * @description 从Redux store中获取问卷组件信息
 * @returns 组件信息
 */

import { useSelector } from 'react-redux';
import { StateType } from '../store';
import { ComponentsStateType } from '../store/componentsReducer';

function useGetComponentInfo() {
  const components = useSelector<StateType>(
    (state) => state.components.present
  ) as ComponentsStateType;
  const { componentList = [], selectedId = '', copiedComponent } = components;

  // 找到选中的组件
  const selectedComponent = componentList.find(
    (comp) => comp.fe_id === selectedId
  );

  return {
    componentList,
    selectedId,
    selectedComponent,
    copiedComponent,
  };
}

export default useGetComponentInfo;
