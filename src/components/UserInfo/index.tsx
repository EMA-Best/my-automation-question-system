import { FC, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { routePath } from '../../router';
import { DownOutlined, UserOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Avatar, Button, Dropdown, Modal, Space, Tag, message } from 'antd';
import { removeToken } from '../../utils/user-token';
import useGetUserInfo from '../../hooks/useGetUserInfo';
import { useDispatch } from 'react-redux';
import { logoutReducer } from '../../store/userReducer';
import styles from './index.module.scss';

const UserInfo: FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // 获取用户信息
  const { username, nickname, role } = useGetUserInfo();

  const displayName = useMemo(() => {
    return nickname || username;
  }, [nickname, username]);

  const roleTag = useMemo(() => {
    if (!username) return null;
    if (role === 'admin') {
      return (
        <Tag className={styles.roleTag} color="gold">
          管理员
        </Tag>
      );
    }
    return (
      <Tag className={styles.roleTag} color="blue">
        普通用户
      </Tag>
    );
  }, [role, username]);

  const doLogout = useCallback(() => {
    dispatch(logoutReducer());
    removeToken();
    message.success('退出成功');
    navigate(routePath.LOGIN);
  }, [dispatch, navigate]);

  const confirmLogout = useCallback(() => {
    Modal.confirm({
      title: '确认退出登录？',
      okText: '退出',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: doLogout,
    });
  }, [doLogout]);

  const onMenuClick = useCallback<NonNullable<MenuProps['onClick']>>(
    (info) => {
      if (info.key === 'logout') {
        confirmLogout();
      }
    },
    [confirmLogout]
  );

  const menuItems = useMemo<NonNullable<MenuProps['items']>>(() => {
    return [
      {
        key: 'profile',
        disabled: true,
        label: (
          <div className={styles.menuProfile}>
            <div className={styles.menuNameRow}>
              <span className={styles.menuName}>
                {displayName || '未命名用户'}
              </span>
              {roleTag}
            </div>
            <div className={styles.menuMeta}>@{username}</div>
          </div>
        ),
      },
      { type: 'divider' },
      {
        key: 'logout',
        label: <span className={styles.menuDanger}>退出登录</span>,
      },
    ];
  }, [displayName, roleTag, username]);

  const loginElem = useMemo(() => {
    return (
      <Link to={routePath.LOGIN} className={styles.loginLink}>
        <Button type="primary" size="small" ghost>
          登录
        </Button>
      </Link>
    );
  }, []);

  const userElem = useMemo(() => {
    return (
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        menu={{ items: menuItems, onClick: onMenuClick }}
      >
        <button type="button" className={styles.trigger}>
          <Space size={8} align="center">
            <Avatar
              size={28}
              className={styles.avatar}
              icon={<UserOutlined />}
            />
            <span className={styles.name}>{displayName}</span>
            {/* {role === 'admin' ? (
              <Tag className={styles.roleTagInline} color="gold">
                管理员
              </Tag>
            ) : null} */}
            <DownOutlined className={styles.downIcon} />
          </Space>
        </button>
      </Dropdown>
    );
  }, [displayName, menuItems, onMenuClick, role]);

  return (
    <div className={styles.container}>{username ? userElem : loginElem}</div>
  );
};

export default UserInfo;
