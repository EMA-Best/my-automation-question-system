import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ComponentPropsType } from '../../components/QuestionComponents';

// 组件信息类型
export type ComponentInfoType = {
  fe_id: string;
  type: string;
  title: string;
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
  },
});

export const { resetComponents, changeSelectedId, addComponent } =
  componentsSlice.actions;

export default componentsSlice.reducer;
