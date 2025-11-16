import { FC } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routePath } from '../../router';
import { UserOutlined } from '@ant-design/icons';
import { Button, message } from 'antd';
import { removeToken } from '../../utils/user-token';
import useGetUserInfo from '../../hooks/useGetUserInfo';
import { useDispatch } from 'react-redux';
import { logoutReducer } from '../../store/userReducer';

const UserInfo: FC = () => {
  const dispatch = useDispatch();
  // 获取用户信息
  const { username, nickname } = useGetUserInfo();
  // const { data } = useRequest(getUserInfoService);s
  // const { username, nickname } = data || {};
  // 退出登录的回调
  const handleLogout = () => {
    dispatch(logoutReducer()); // 清空用户信息
    removeToken();
    message.success('退出成功');
    navigate(routePath.LOGIN);
  };
  // 展示用户信息的JSX
  const UserInfoElem = (
    <>
      <span style={{ color: '#fff' }}>
        <UserOutlined />
        {nickname}
      </span>
      <Button type="link" onClick={handleLogout}>
        退出
      </Button>
    </>
  );
  // 展示登录的JSX
  const LoginElem = (
    <>
      <Link to={routePath.LOGIN}>登录</Link>
    </>
  );
  const navigate = useNavigate();

  return <>{username ? UserInfoElem : LoginElem}</>;
};

export default UserInfo;
