import { FC } from 'react';
import styles from './index.module.scss';
import { Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { LeftOutlined } from '@ant-design/icons';
import { routePath } from '../../../../router';
import EditToolbar from './EditToolbar';
import EditTitle from './EditTitle';
import EditSaveButton from './EditSaveButton';
import EditPublishButton from './EditPublishButton';
import EditSubmitReviewButton from './EditSubmitReviewButton';
import EditExportButton from './EditExportButton';
import EditImportButton from './EditImportButton';
import EditAIGenerateButton from './EditAIGenerateButton';
import EditSaveAsTemplateButton from './EditSaveAsTemplateButton';

const EditHeader: FC = () => {
  const navigate = useNavigate();
  return (
    <div className={styles['header-wrapper']}>
      <div className={styles.header}>
        <div className={styles.left}>
          <Space>
            <Button
              type="link"
              // 固定返回管理问卷列表，避免从模板登录中转链路进入时回到中转页
              onClick={() => navigate(routePath.MANAGE_LIST)}
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
            <EditImportButton />
            <EditAIGenerateButton />
            <EditExportButton />
            <EditSaveAsTemplateButton />
            <EditSaveButton />
            <EditSubmitReviewButton />
            <EditPublishButton />
          </Space>
        </div>
      </div>
    </div>
  );
};

export default EditHeader;
