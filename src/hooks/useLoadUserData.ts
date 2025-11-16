/**
 * @description 从后端加载用户信息存储到redux store
 */

import { useEffect, useState } from 'react';
import { useRequest } from 'ahooks';
import { getUserInfoService } from '../services/user';
import useGetUserInfo from './useGetUserInfo';
import { useDispatch } from 'react-redux';
import { loginReducer } from '../store/userReducer';

function useLoadUserData() {
  // 定义是否在等待用户数据加载完成
  const [waitingUserData, setWaitingUserData] = useState(true);

  const dispatch = useDispatch();
  // ajax获取用户信息
  const { run } = useRequest(getUserInfoService, {
    manual: true,
    onSuccess(result) {
      const { username, nickname } = result;
      dispatch(loginReducer({ username, nickname })); // 存储用户信息到redux store
    },
    // 无论成功失败，都设置waitingUserData为false
    onFinally() {
      setWaitingUserData(false);
    },
  });

  // 从redux store中获取用户信息 判断是否存在username
  const { username } = useGetUserInfo();
  // 当username变化时，触发获取用户信息的ajax请求
  useEffect(() => {
    // 只有当username存在时，才触发获取用户信息的ajax请求
    if (username) {
      setWaitingUserData(false);
      return;
    }
    run();
  }, [username]);

  return { waitingUserData };
}

export default useLoadUserData;
