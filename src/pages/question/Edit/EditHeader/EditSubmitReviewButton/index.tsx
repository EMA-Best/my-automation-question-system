import { FC, useCallback, useMemo } from 'react';
import { Button, Tooltip, message } from 'antd';
import { useRequest } from 'ahooks';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import useGetPageInfo from '../../../../../hooks/useGetPageInfo';
import useGetUserInfo from '../../../../../hooks/useGetUserInfo';
import { submitQuestionReviewService } from '../../../../../services/question';
import { updatePageInfo } from '../../../../../store/pageInfoReducer';

const EditSubmitReviewButton: FC = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const pageInfo = useGetPageInfo();
  const { role } = useGetUserInfo();

  const { isPublished, auditStatus, auditReason } = pageInfo;

  const disabledReason = useMemo(() => {
    if (role === 'admin') return '管理员无需提交审核';
    if (isPublished) return '已发布问卷无需提交审核';
    if (auditStatus === 'PendingReview') return '已提交审核，请等待管理员处理';
    if (auditStatus === 'Approved') return '已通过审核，可直接发布';
    return '';
  }, [auditStatus, isPublished, role]);

  const canSubmit = useMemo(() => {
    if (role === 'admin') return false;
    if (isPublished) return false;
    if (auditStatus === 'PendingReview') return false;
    if (auditStatus === 'Approved') return false;
    // Draft / Rejected / undefined 都允许提交
    return true;
  }, [auditStatus, isPublished, role]);

  const { loading, run } = useRequest(
    async () => {
      if (!id) return;
      await submitQuestionReviewService(id);
    },
    {
      manual: true,
      onSuccess: () => {
        message.success('提交审核成功');
        dispatch(
          updatePageInfo({
            auditStatus: 'PendingReview',
            auditReason: '',
          })
        );
      },
    }
  );

  const handleSubmit = useCallback(() => {
    if (!canSubmit) {
      if (auditStatus === 'Rejected' && auditReason) {
        message.warning(`已驳回：${auditReason}`);
        return;
      }
      if (disabledReason) {
        message.info(disabledReason);
      }
      return;
    }
    run();
  }, [auditReason, auditStatus, canSubmit, disabledReason, run]);

  const tooltipTitle = useMemo(() => {
    if (auditStatus === 'Rejected' && auditReason)
      return `驳回原因：${auditReason}`;
    return disabledReason;
  }, [auditReason, auditStatus, disabledReason]);

  // 管理员视角不展示（避免误导）
  if (role === 'admin') return null;

  return (
    <Tooltip title={canSubmit ? '' : tooltipTitle}>
      <span>
        <Button onClick={handleSubmit} disabled={!canSubmit || loading}>
          提交审核
        </Button>
      </span>
    </Tooltip>
  );
};

export default EditSubmitReviewButton;
