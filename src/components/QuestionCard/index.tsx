import { FC, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './index.module.scss';
import {
  Button,
  Tag,
  Space,
  Divider,
  Popconfirm,
  Modal,
  Tooltip,
  message,
} from 'antd';
import {
  StarOutlined,
  EditOutlined,
  LineChartOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useRequest } from 'ahooks';
import {
  duplicateQuestionService,
  getQuestionService,
  updateQuestionService,
} from '../../services/question';
import { formatDateTime } from '../../utils/formatDateTime';
import type { AuditStatus } from '../../types/audit';
import useGetUserInfo from '../../hooks/useGetUserInfo';
import { exportQuestionById } from '../../utils/exportQuestion';

// 定义问卷卡片组件的props类型
type propsType = {
  id: string;
  title: string;
  isPublished: boolean;
  isStar: boolean;
  answerCount: number;
  createdAt: string;
  auditStatus?: AuditStatus;
  auditReason?: string;
};

// 解构出Modal组件的confirm方法
const { confirm } = Modal;

const QuestionCard: FC<propsType> = (props: propsType) => {
  // console.log('问卷卡片props: ', props);
  // 导航器
  const navigate = useNavigate();
  const { username, nickname } = useGetUserInfo();
  // 解构props中的属性值
  const { id, title, isPublished, isStar, answerCount, createdAt } = props;
  const { auditStatus, auditReason } = props;

  const auditTag = useMemo(() => {
    if (!auditStatus) return null;
    const map: Record<AuditStatus, { color?: string; text: string }> = {
      Draft: { color: 'default', text: '草稿' },
      PendingReview: { color: 'processing', text: '待审核' },
      Approved: { color: 'success', text: '已通过' },
      Rejected: { color: 'error', text: '已驳回' },
    };
    const conf = map[auditStatus];
    const tagNode = <Tag color={conf.color}>{conf.text}</Tag>;
    if (auditStatus === 'Rejected' && auditReason) {
      return <Tooltip title={`驳回原因：${auditReason}`}>{tagNode}</Tooltip>;
    }
    return tagNode;
  }, [auditReason, auditStatus]);
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
        navigate(`/question/edit/${result.id || result._id}`);
      },
    }
  );

  // 处理取消复制问卷的回调
  const handleCancel = () => {
    message.info('复制已取消');
  };

  // 处理编辑问卷的回调
  const handleEdit = (id: string) => {
    // message.success('编辑成功');
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

  // 处理数据统计的回调
  const handleStat = () => {
    navigate(`/question/stat/${id}`);
  };

  // 导出问卷（复用编辑页导出逻辑）
  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      await exportQuestionById({
        id,
        title,
        author: username || nickname || '',
        isStar: isStarState,
        loadDetail: getQuestionService,
      });
    } catch {
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

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
              {isStarState && <StarOutlined style={{ color: 'red' }} />}
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
            {auditTag}
            <span>答卷：{answerCount}</span>
            <span>{formatDateTime(createdAt)}</span>
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
            onClick={handleStat}
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
              icon={<DownloadOutlined />}
              onClick={handleExport}
              disabled={exporting}
            >
              导出
            </Button>

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
