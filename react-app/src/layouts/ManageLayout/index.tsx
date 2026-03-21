import { FC } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import styles from './index.module.scss';
import { Space, Button, Divider } from 'antd';
import {
  PlusOutlined,
  BarsOutlined,
  StarOutlined,
  DeleteOutlined,
  AuditOutlined,
  TeamOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { createQuestionService } from '../../services/question';
import { useRequest } from 'ahooks';
import Access from '../../components/Access';
import { routePath } from '../../router';
import useGetUserInfo from '../../hooks/useGetUserInfo';

const ManageLayout: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // 新建问卷按钮是否loading状态
  const { pathname } = location;

  const { role } = useGetUserInfo();
  const isAdmin = role === 'admin';

  // 跳转到全部问卷列表页
  const toAllQuestions = () => {
    navigate(routePath.MANAGE_LIST);
  };

  // 跳转到星标问卷列表页
  const toStarQuestions = () => {
    navigate(routePath.MANAGE_STAR);
  };

  // 跳转到回收站列表页
  const toTrashQuestions = () => {
    navigate(routePath.MANAGE_TRASH);
  };

  const toReviews = () => {
    navigate(routePath.MANAGE_REVIEWS);
  };

  const toUsers = () => {
    navigate(routePath.MANAGE_USERS);
  };

  // 跳转到模板管理页
  const toTemplates = () => {
    navigate(routePath.MANAGE_TEMPLATES);
  };

  // 新建问卷按钮的回调
  const { loading, run } = useRequest(createQuestionService, {
    manual: true, // 手动触发
    onSuccess: (result) => {
      navigate(`/question/edit/${result.id || result._id}`);
      // message.success('新建问卷成功');
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
            onClick={toAllQuestions}
          >
            全部问卷
          </Button>
          <Button
            type={pathname.startsWith('/manage/star') ? 'default' : 'text'}
            size="large"
            icon={<StarOutlined />}
            onClick={toStarQuestions}
          >
            {isAdmin ? '运营推荐' : '星标问卷'}
          </Button>
          <Button
            type={pathname.startsWith('/manage/trash') ? 'default' : 'text'}
            size="large"
            icon={<DeleteOutlined />}
            onClick={toTrashQuestions}
          >
            回收站
          </Button>

          <Access need="manage:admin">
            <Divider />
            <Button
              type={pathname.startsWith('/manage/reviews') ? 'default' : 'text'}
              size="large"
              icon={<AuditOutlined />}
              onClick={toReviews}
            >
              审核队列
            </Button>
            <Button
              type={pathname.startsWith('/manage/users') ? 'default' : 'text'}
              size="large"
              icon={<TeamOutlined />}
              onClick={toUsers}
            >
              用户管理
            </Button>
            <Button
              type={
                pathname.startsWith('/manage/templates') ? 'default' : 'text'
              }
              size="large"
              icon={<AppstoreOutlined />}
              onClick={toTemplates}
            >
              模板管理
            </Button>
          </Access>
        </Space>
      </div>
      <div className={styles.right}>
        <Outlet />
      </div>
    </div>
  );
};

export default ManageLayout;
