import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { UserRole } from '../types/user';

// 用户状态类型
export type UserStateType = {
  username: string;
  nickname: string;
  role: UserRole;
};

// 初始用户状态
const INIT_STATE: UserStateType = {
  username: '',
  nickname: '',
  role: 'user',
};

export const userSlice = createSlice({
  name: 'user',
  initialState: INIT_STATE,
  reducers: {
    loginReducer(state: UserStateType, actions: PayloadAction<UserStateType>) {
      return actions.payload; // 设置用户状态到redux store
    },
    logoutReducer() {
      return INIT_STATE; // 清空用户状态
    },
  },
});

export const { loginReducer, logoutReducer } = userSlice.actions;

export default userSlice.reducer;
