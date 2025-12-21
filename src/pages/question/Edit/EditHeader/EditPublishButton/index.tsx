import { FC } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useGetComponentInfo from '../../../../../hooks/useGetComponentInfo';
import useGetPageInfo from '../../../../../hooks/useGetPageInfo';
import { useRequest } from 'ahooks';
import { Button, message } from 'antd';
import { updateQuestionService } from '../../../../../services/question';

const EditPublishButton: FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { componentList = [] } = useGetComponentInfo();
  const pageInfo = useGetPageInfo();

  // ajax 发布问卷
  const { loading, run: publish } = useRequest(
    async () => {
      if (!id) return;
      await updateQuestionService(id, {
        ...pageInfo,
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
    }
  );

  return (
    <Button type="primary" onClick={publish} disabled={loading}>
      发布
    </Button>
  );
};

export default EditPublishButton;
