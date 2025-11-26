import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userReducer';
import type { UserStateType } from './userReducer';
import componentsReducer from './componentsReducer';
import type { ComponentsStateType } from './componentsReducer';
import pageInfoReducer from './pageInfoReducer';
import type { PageInfoType } from './pageInfoReducer';
import undoable, { excludeAction, StateWithHistory } from 'redux-undo';

// 全局状态类型
export type StateType = {
  user: UserStateType;
  components: StateWithHistory<ComponentsStateType>; // 组件状态，包含历史记录
  pageInfo: PageInfoType;
};

export default configureStore({
  reducer: {
    user: userReducer,
    // 没有undo功能
    //components: componentsReducer,

    // 有undo功能
    components: undoable(componentsReducer, {
      limit: 20, // 限制 undo 操作的次数
      // 排除一些action不进行undo操作
      filter: excludeAction(['components/resetComponents']),
    }),

    pageInfo: pageInfoReducer,
  },
});
