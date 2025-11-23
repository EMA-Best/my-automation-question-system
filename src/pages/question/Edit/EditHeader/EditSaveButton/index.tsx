import { FC } from 'react';
import { useParams } from 'react-router-dom';
import useGetComponentInfo from '../../../../../hooks/useGetComponentInfo';
import { useKeyPress, useRequest, useDebounceEffect } from 'ahooks';
import { updateQuestionService } from '../../../../../services/question';
import { Button } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import useGetPageInfo from '../../../../../hooks/useGetPageInfo';

const EditSaveButton: FC = () => {
  // 获取路由参数中的问卷id
  const { id } = useParams();
  const { componentList = [] } = useGetComponentInfo();
  const pageInfo = useGetPageInfo();

  // ajax 保存问卷
  const { loading, run: save } = useRequest(
    async () => {
      if (!id) return;
      await updateQuestionService(id, { ...pageInfo, componentList });
    },
    { manual: true }
  );

  // 快捷键保存
  useKeyPress(['ctrl.s', 'meta.s'], (e: KeyboardEvent) => {
    // 防止默认事件（浏览器默认保存事件）
    e.preventDefault();
    if (!loading) save();
  });

  // 自动保存(防抖)
  useDebounceEffect(
    () => {
      save();
    },
    [componentList, pageInfo],
    { wait: 1000 }
  );

  return (
    <Button
      onClick={save}
      disabled={loading}
      icon={loading ? <LoadingOutlined /> : null}
    >
      保存
    </Button>
  );
};

export default EditSaveButton;
