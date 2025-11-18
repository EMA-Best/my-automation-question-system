import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ComponentPropsType } from '../../components/QuestionComponents';
import { getNextSelectedId } from './utils';

// 组件信息类型
export type ComponentInfoType = {
  fe_id: string; // 前端生成的id，服务端Mongodb不认这种格式，所以自定义一个fe_id
  type: string;
  title: string;
  isHidden?: boolean;
  isLocked?: boolean;
  props: ComponentPropsType;
};

export type ComponentsStateType = {
  componentList: Array<ComponentInfoType>; // 组件列表
  selectedId: string; // 选中组件的ID
};

const INIT_STATE: ComponentsStateType = {
  componentList: [],
  selectedId: '',
};

export const componentsSlice = createSlice({
  name: 'components',
  initialState: INIT_STATE,
  reducers: {
    // 重置所有组件
    resetComponents: (
      state: ComponentsStateType,
      action: PayloadAction<ComponentsStateType>
    ) => {
      state.componentList = action.payload.componentList;
      state.selectedId = action.payload.selectedId;
    },
    // 改变选中组件ID
    changeSelectedId: (
      state: ComponentsStateType,
      action: PayloadAction<string>
    ) => {
      state.selectedId = action.payload;
    },
    // 添加新组件
    addComponent: (
      state: ComponentsStateType,
      action: PayloadAction<ComponentInfoType>
    ) => {
      const newComponent = action.payload;
      const { selectedId, componentList } = state;
      // 寻找当前选中的组件
      const index = componentList.findIndex((c) => c.fe_id === selectedId);

      if (index < 0) {
        // 未选中任何组件 直接在组件最后添加
        state.componentList.push(newComponent);
      } else {
        // 选中了组件 在选中组件后面添加
        state.componentList.splice(index + 1, 0, newComponent);
      }
      // 选中新添加的组件
      state.selectedId = newComponent.fe_id;
    },
    // 修改组件属性
    changeComponentProps: (
      state: ComponentsStateType,
      action: PayloadAction<{
        fe_id: string;
        newProps: ComponentPropsType;
      }>
    ) => {
      const { fe_id, newProps } = action.payload;
      // 当前要修改属性的这个组件
      const curComponent = state.componentList.find((c) => c.fe_id === fe_id);
      if (curComponent == null) return;
      curComponent.props = { ...curComponent.props, ...newProps };
    },
    // 删除选中的组件
    removeSelectedComponent: (state: ComponentsStateType) => {
      const { selectedId, componentList } = state;
      // 寻找当前选中的组件
      const index = componentList.findIndex((c) => c.fe_id === selectedId);
      // 未选中任何组件 什么也不做
      if (index < 0) return;
      // 重新计算 selectedId
      const newSelectedId = getNextSelectedId(componentList, selectedId);
      state.selectedId = newSelectedId;
      // 删除选中的组件
      componentList.splice(index, 1);
    },
    // 隐藏/显示 组件
    changeComponentHidden: (
      state: ComponentsStateType,
      action: PayloadAction<{
        fe_id: string;
        isHidden: boolean;
      }>
    ) => {
      const { componentList } = state;
      const { fe_id, isHidden } = action.payload;

      // 重新计算 selectedId
      let newSelectedId = '';
      if (isHidden) {
        // 要隐藏
        newSelectedId = getNextSelectedId(componentList, fe_id);
      } else {
        // 要显示
        newSelectedId = fe_id;
      }
      state.selectedId = newSelectedId;

      // 找到当前要隐藏的组件
      const curComponent = componentList.find((c) => c.fe_id === fe_id);
      if (curComponent == null) return;
      curComponent.isHidden = isHidden;
    },
    // 锁定/解锁 组件
    toggleComponentLocked: (
      state: ComponentsStateType,
      action: PayloadAction<{
        fe_id: string;
      }>
    ) => {
      const { componentList } = state;
      const { fe_id } = action.payload;

      // 找到当前要锁定/解锁的组件
      const curComponent = componentList.find((c) => c.fe_id === fe_id);
      if (curComponent == null) return;
      curComponent.isLocked = !curComponent.isLocked;
    },
  },
});

export const {
  resetComponents,
  changeSelectedId,
  addComponent,
  changeComponentProps,
  removeSelectedComponent,
  changeComponentHidden,
  toggleComponentLocked,
} = componentsSlice.actions;

export default componentsSlice.reducer;
