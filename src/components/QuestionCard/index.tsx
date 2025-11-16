import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './index.module.scss';
import { Button, Tag, Space, Divider, Popconfirm, Modal, message } from 'antd';
import {
  StarOutlined,
  EditOutlined,
  LineChartOutlined,
  CopyOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useRequest } from 'ahooks';
import {
  duplicateQuestionService,
  updateQuestionService,
} from '../../services/question';

// 定义问卷卡片组件的props类型
type propsType = {
  id: string;
  title: string;
  isPublished: boolean;
  isStar: boolean;
  answerCount: number;
  createdTime: string;
};

// 解构出Modal组件的confirm方法
const { confirm } = Modal;

const QuestionCard: FC<propsType> = (props: propsType) => {
  // console.log('问卷卡片props:', props);
  // 导航器
  const navigate = useNavigate();
  // 解构props中的属性值
  const { id, title, isPublished, isStar, answerCount, createdTime } = props;
  // 处理复制问卷的回调
  // const handleCopy = () => {
  //   message.success('复制成功');
  // };

  // 复制问卷
  const { loading: duplicateLoading, run: duplicateQuestion } = useRequest(
    async () => {
      const result = await duplicateQuestionService(id);
      return result;
    },
    {
      manual: true,
      onSuccess(result) {
        message.success('复制成功');
        navigate(`/question/edit/${result.id}`);
      },
    }
  );

  // 处理取消复制问卷的回调
  const handleCancel = () => {
    message.info('复制已取消');
  };

  // 处理编辑问卷的回调
  const handleEdit = (id: string) => {
    message.success('编辑成功');
    navigate(`/question/edit/${id}`);
  };

  // 删除问卷
  const [isDeleted, setIsDeleted] = useState(false);
  const { loading: deleteQuestionLoading, run: deleteQuestion } = useRequest(
    async () => {
      const result = await updateQuestionService(id, { isDeleted: true });
      return result;
    },
    {
      manual: true,
      onSuccess() {
        message.success('删除成功');
        setIsDeleted(true);
      },
    }
  );
  // 处理删除问卷的回调
  const handleDelete = () => {
    confirm({
      title: '确定删除该问卷吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: deleteQuestion,
      onCancel: () => {
        message.info('删除已取消');
      },
      icon: <ExclamationCircleOutlined />,
    });
  };

  // 修改标星的操作
  const [isStarState, setIsStarState] = useState(isStar);
  // loading控制按钮是否可用 防止重复点击
  const { loading: changeStarLoading, run: changeStar } = useRequest(
    async () => {
      await updateQuestionService(id, { isStar: !isStarState });
    },
    {
      manual: true,
      onSuccess() {
        setIsStarState(!isStarState); // 更新state
        message.success('更新成功');
      },
    }
  );

  // 如果问卷已被删除，则不渲染
  if (isDeleted) return null;

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <div className={styles.left}>
          <Link
            to={isPublished ? `/question/stat/${id}` : `/question/edit/${id}`}
          >
            <Space>
              {isStar && <StarOutlined style={{ color: 'red' }} />}
              {title}
            </Space>
          </Link>
        </div>
        <div className={styles.right}>
          <Space>
            {isPublished ? (
              <Tag color="processing">已发布</Tag>
            ) : (
              <Tag>未发布</Tag>
            )}
            <span>答卷：{answerCount}</span>
            <span>{createdTime}</span>
          </Space>
        </div>
      </div>
      <Divider />
      <div className={styles.buttonContainer}>
        <div className={styles.left}>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(id)}
          >
            编辑问卷
          </Button>
          <Button
            type="text"
            size="small"
            icon={<LineChartOutlined />}
            disabled={!isPublished}
          >
            数据统计
          </Button>
        </div>
        <div className={styles.right}>
          <Space>
            <Button
              type="text"
              size="small"
              icon={<StarOutlined />}
              onClick={changeStar}
              disabled={changeStarLoading}
            >
              {isStarState ? '取消标星' : '标星'}
            </Button>

            <Popconfirm
              title="确定复制该问卷吗？"
              okText="确定"
              cancelText="取消"
              onConfirm={duplicateQuestion}
              onCancel={handleCancel}
            >
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                disabled={duplicateLoading}
              >
                复制
              </Button>
            </Popconfirm>

            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={handleDelete}
              disabled={deleteQuestionLoading}
            >
              删除
            </Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
