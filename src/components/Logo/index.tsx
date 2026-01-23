import { FC } from 'react';
import styles from './index.module.scss';
import { Link } from 'react-router-dom';
import { Space, Typography } from 'antd';
import { FormOutlined } from '@ant-design/icons';
// import useGetUserInfo from '../../hooks/useGetUserInfo';
import { routePath } from '../../router';

const { Title } = Typography;

const Logo: FC = () => {
  // const { username } = useGetUserInfo();

  // 如果已登录，点击LOGO跳转到管理列表页，否则跳转首页
  // const [pathname, setPathname] = useState(routePath.HOME);

  // useEffect(() => {
  //   if (username) {
  //     setPathname(routePath.MANAGE_LIST);
  //   }
  // }, [username]);

  return (
    <div className={styles.container}>
      <Link to={routePath.HOME}>
        <Space>
          <Title>
            <FormOutlined />
          </Title>
          <Title>小伦问卷</Title>
        </Space>
      </Link>
    </div>
  );
};

export default Logo;
