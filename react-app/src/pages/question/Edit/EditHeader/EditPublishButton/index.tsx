import { FC } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useGetComponentInfo from '../../../../../hooks/useGetComponentInfo';
import useGetPageInfo from '../../../../../hooks/useGetPageInfo';
import { useRequest } from 'ahooks';
import { Button, Tooltip, message } from 'antd';
import { updateQuestionService } from '../../../../../services/question';
import useGetUserInfo from '../../../../../hooks/useGetUserInfo';

const EditPublishButton: FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { componentList = [] } = useGetComponentInfo();
  const pageInfo = useGetPageInfo();
  const { role } = useGetUserInfo();

  const { auditStatus, auditReason } = pageInfo;
  const { isPublished } = pageInfo;

  // 已发布问卷不可再次点击发布
  const canPublish =
    !isPublished && (role === 'admin' || auditStatus === 'Approved');

  // ajax 发布问卷
  const { loading, run: publish } = useRequest(
    async () => {
      if (!id) return;
      if (!canPublish) {
        if (auditStatus === 'Rejected' && auditReason) {
          throw new Error(`审核未通过：${auditReason}`);
        }
        throw new Error('发布前需通过审核');
      }

      // 审核字段由后端维护，避免被前端误传覆盖
      const {
        auditStatus: _auditStatus,
        auditReason: _auditReason,
        ...rest
      } = pageInfo;
      void _auditStatus;
      void _auditReason;
      await updateQuestionService(id, {
        ...rest,
        componentList,
        isPublished: true, // 标识问卷已发布
      });
    },
    {
      manual: true,
      onSuccess() {
        message.success('发布成功');
        navigate('/question/stat/' + id); // 发布成功跳转到统计页面
      },
      onError: (err) => {
        message.error(err.message || '发布失败');
      },
    }
  );

  const tooltipTitle = isPublished
    ? '该问卷已发布'
    : role === 'admin'
      ? ''
      : auditStatus === 'Rejected' && auditReason
        ? `审核未通过：${auditReason}`
        : !canPublish
          ? '发布前需通过审核'
          : '';

  return (
    <Tooltip title={tooltipTitle}>
      <span>
        <Button
          type="primary"
          onClick={publish}
          disabled={loading || !canPublish}
        >
          发布
        </Button>
      </span>
    </Tooltip>
  );
};

export default EditPublishButton;
