import { FC, useCallback } from 'react';
import { Button, Modal, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { useRequest } from 'ahooks';
import useGetUserInfo from '../../../../../hooks/useGetUserInfo';
import { createTemplateFromQuestionService } from '../../../../../services/template';

type CreateTemplateRes = {
  id?: unknown;
  templateId?: unknown;
};

function getCreatedTemplateId(payload: unknown): string {
  if (typeof payload !== 'object' || payload == null) return '';
  const data = payload as CreateTemplateRes;
  if (typeof data.id === 'string') return data.id;
  if (typeof data.templateId === 'string') return data.templateId;
  return '';
}

/**
 * 编辑页头部「保存为模板」按钮（管理员专属）
 *
 * 行为：
 * 1) 仅管理员可见
 * 2) 点击后将当前问卷克隆为一个草稿模板（draft）
 * 3) 成功后提示模板 id，便于进入模板管理页继续发布
 */
const EditSaveAsTemplateButton: FC = () => {
  const { role } = useGetUserInfo();
  const { id } = useParams();

  const { loading, run } = useRequest(
    async () => {
      if (!id) throw new Error('问卷 ID 不存在，无法保存为模板');
      return await createTemplateFromQuestionService(id);
    },
    {
      manual: true,
      onSuccess: (res) => {
        const templateId = getCreatedTemplateId(res);
        if (templateId) {
          message.success(`已保存为模板（草稿），模板ID：${templateId}`);
          return;
        }
        message.success('已保存为模板（草稿）');
      },
    }
  );

  const handleClick = useCallback(() => {
    Modal.confirm({
      title: '确认保存为模板？',
      content: '会基于当前问卷创建一个草稿模板，后续可在“模板管理”中发布。',
      okText: '保存',
      cancelText: '取消',
      onOk: async () => {
        await run();
      },
    });
  }, [run]);

  // 非管理员不展示该按钮
  if (role !== 'admin') return null;

  return (
    <Button onClick={handleClick} loading={loading} icon={<CopyOutlined />}>
      保存为模板
    </Button>
  );
};

export default EditSaveAsTemplateButton;
