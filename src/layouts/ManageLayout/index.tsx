import { FC } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import styles from './index.module.scss';
import { Space, Button, Divider, message } from 'antd';
import {
  PlusOutlined,
  BarsOutlined,
  StarOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { createQuestionService } from '../../services/question';
import { useRequest } from 'ahooks';

const ManageLayout: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // 新建问卷按钮是否loading状态
  const { pathname } = location;

  // 跳转到我的问卷列表页
  const toMyQuestions = () => {
    console.log(pathname);

    navigate('/manage/list');
  };

  // 跳转到星标问卷列表页
  const toStarQuestions = () => {
    console.log(pathname);
    navigate('/manage/star');
  };

  // 跳转到回收站列表页
  const toTrashQuestions = () => {
    console.log(pathname);
    navigate('/manage/trash');
  };

  // 新建问卷按钮的回调
  const { loading, run } = useRequest(createQuestionService, {
    manual: true, // 手动触发
    onSuccess: (result) => {
      navigate(`/question/edit/${result.id || result._id}`);
      message.success('新建问卷成功');
    },
  });
  // const handleCreate = async () => {
  //   // 点击新建问卷按钮后，禁用按钮，防止重复点击
  //   setLoading(true);
  //   const data = await createQuestionService();
  //   const { id } = data;
  //   if (id) {
  //     navigate(`/question/edit/${id}`);
  //     message.success('新建问卷成功');
  //   }
  //   // 新建问卷成功后，启用按钮
  //   setLoading(false);
  // };

  return (
    <div className={styles.container}>
      <div className={styles.left}>
        <Space wrap>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={run}
            disabled={loading}
          >
            新建问卷
          </Button>
          <Divider />
          <Button
            type={pathname.startsWith('/manage/list') ? 'default' : 'text'}
            size="large"
            icon={<BarsOutlined />}
            onClick={toMyQuestions}
          >
            我的问卷
          </Button>
          <Button
            type={pathname.startsWith('/manage/star') ? 'default' : 'text'}
            size="large"
            icon={<StarOutlined />}
            onClick={toStarQuestions}
          >
            星标问卷
          </Button>
          <Button
            type={pathname.startsWith('/manage/trash') ? 'default' : 'text'}
            size="large"
            icon={<DeleteOutlined />}
            onClick={toTrashQuestions}
          >
            回收站
          </Button>
        </Space>
      </div>
      <div className={styles.right}>
        <Outlet />
      </div>
    </div>
  );
};

export default ManageLayout;
