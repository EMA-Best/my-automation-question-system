import { FC } from 'react';
import styles from './index.module.scss';
import { Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { LeftOutlined } from '@ant-design/icons';
import EditToolbar from './EditToolbar';
import EditTitle from './EditTitle';
import EditSaveButton from './EditSaveButton';

const EditHeader: FC = () => {
  const navigate = useNavigate();
  return (
    <div className={styles['header-wrapper']}>
      <div className={styles.header}>
        <div className={styles.left}>
          <Space>
            <Button
              type="link"
              onClick={() => navigate(-1)}
              icon={<LeftOutlined />}
            >
              返回
            </Button>
            <EditTitle />
          </Space>
        </div>
        <div className={styles.main}>
          <EditToolbar />
        </div>
        <div className={styles.right}>
          <Space>
            <EditSaveButton />
            <Button type="primary">发布</Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default EditHeader;
