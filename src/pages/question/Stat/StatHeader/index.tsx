import { FC } from 'react';
import styles from './index.module.scss';
import { useNavigate, useParams } from 'react-router-dom';
import useGetPageInfo from '../../../../hooks/useGetPageInfo';
import { LeftOutlined } from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';
import { routePath } from '../../../../router';
// 头部中间二维码部分
import StatQRCodeElem from './StatQRCodeElem';

const { Title } = Typography;

const StatHeader: FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { title } = useGetPageInfo();

  // 去编辑问卷页面的回调
  const handleEdit = () => {
    navigate(`/question/edit/${id}`);
  };

  return (
    <div className={styles['header-wrapper']}>
      <div className={styles.header}>
        <div className={styles.left}>
          <Space>
            <Button
              type="link"
              icon={<LeftOutlined />}
              // 固定返回管理问卷列表，避免回到登录中转历史页
              onClick={() => navigate(routePath.MANAGE_LIST)}
            >
              返回
            </Button>
            <Title>{title}</Title>
          </Space>
        </div>
        <div className={styles.main}>
          <StatQRCodeElem />
        </div>
        <div className={styles.right}>
          <Button type="primary" onClick={handleEdit}>
            编辑问卷
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StatHeader;
