import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userReducer';
import type { UserStateType } from './userReducer';
import componentsReducer from './componentsReducer';
import type { ComponentsStateType } from './componentsReducer';
import pageInfoReducer from './pageInfoReducer';
import type { PageInfoType } from './pageInfoReducer';

// 全局状态类型
export type StateType = {
  user: UserStateType;
  components: ComponentsStateType;
  pageInfo: PageInfoType;
};

export default configureStore({
  reducer: {
    user: userReducer,
    components: componentsReducer,
    pageInfo: pageInfoReducer,
  },
});
