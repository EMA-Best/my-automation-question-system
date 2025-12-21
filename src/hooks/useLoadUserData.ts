/**
 * @description 从后端加载用户信息存储到redux store
 */

import { useEffect, useState } from 'react';
import { useRequest } from 'ahooks';
import { getUserInfoService } from '../services/user';
import useGetUserInfo from './useGetUserInfo';
import { useDispatch } from 'react-redux';
import { loginReducer } from '../store/userReducer';
// import { getToken } from '../utils/user-token';

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

  // 组件挂载时或username变化时，检查并加载用户信息
  useEffect(() => {
    // 如果已经有用户名，说明用户信息已经加载完成
    console.log('username：', username);

    if (username) {
      setWaitingUserData(false);
      return;
    }
    run();

    // 检查是否有token
    // const token = getToken();
    // if (token) {
    //   // 有token但没有用户名，说明刚登录成功，需要加载用户信息
    //   run();
    // } else {
    //   // 没有token也没有用户名，说明未登录，不需要加载用户信息
    //   setWaitingUserData(false);
    // }
  }, [username]);

  return { waitingUserData, loadUserInfo: run };
}

export default useLoadUserData;
