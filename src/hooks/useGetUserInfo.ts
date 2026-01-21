/**
 * @description 获取用户信息的hook
 * @description 从redux store中获取用户信息
 * @description 以info的hook命名代表从前端获取数据
 */

import { useSelector } from 'react-redux';
import type { StateType } from '../store';
import { UserStateType } from '../store/userReducer';

function useGetUserInfo() {
  // StateType限制state类型
  // UserStateType限制该函数的返回值类型
  const { username, nickname, role } = useSelector<StateType>(
    (state) => state.user
  ) as UserStateType;
  return { username, nickname, role };
}

export default useGetUserInfo;
