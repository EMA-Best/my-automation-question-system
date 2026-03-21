import { FC, useState } from 'react';
import { Button } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import AIGenerateModal from './AIGenerateModal';

const EditAIGenerateButton: FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button icon={<RobotOutlined />} onClick={() => setModalOpen(true)}>
        AI生成
      </Button>
      <AIGenerateModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

export default EditAIGenerateButton;
