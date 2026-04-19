import { FC, useState } from 'react';
import {
  Table,
  Tag,
  Typography,
  Empty,
  Space,
  Button,
  Modal,
  Spin,
  message,
} from 'antd';
import { useTitle, useRequest } from 'ahooks';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import styles from '../common.module.scss';
import ListSearch from '../../../components/ListSearch';
import useLoadQuestionListData from '../../../hooks/useLoadQuestionListData';
import useGetUserInfo from '../../../hooks/useGetUserInfo';
import AdminTrash from '../AdminTrash';
import {
  deleteQuestionService,
  updateQuestionService,
} from '../../../services/question';
import { formatDateTime } from '../../../utils/formatDateTime';
import ListPage from '../../../components/ListPage';
import type { QuestionListItem } from '../../../services/question';

const questionColumns = [
  {
    title: '问卷标题',
    dataIndex: 'title',
    key: 'title',
  },
  {
    title: '是否发布',
    dataIndex: 'isPublished',
    key: 'isPublished',
    render: (isPublished: boolean) => {
      return isPublished ? (
        <Tag color="processing">已发布</Tag>
      ) : (
        <Tag>未发布</Tag>
      );
    },
  },
  {
    title: '是否星标',
    dataIndex: 'isStar',
    key: 'isStar',
    render: (isStar: boolean) => {
      return isStar ? <Tag color="red">星标</Tag> : <Tag>普通</Tag>;
    },
  },
  {
    title: '问卷回答数',
    dataIndex: 'answerCount',
    key: 'answerCount',
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    // 格式化时间
    render: (createdAt: unknown) => formatDateTime(createdAt),
  },
];

const { Title } = Typography;

const { confirm } = Modal;

const TrashUser: FC = () => {
  useTitle('回收站 | 小伦问卷 · 管理端');
  // refresh用于重新刷新数据
  const { loading, data, refresh } = useLoadQuestionListData({
    isDeleted: true,
  });
  // console.log('trash data: ', data);

  const { list, count: total } = data ?? { list: [], count: 0 };
  // console.log('total：', total);

  // 记录选中的问卷id
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 恢复操作
  const { run: recover } = useRequest(
    async () => {
      // for await...of 用于按顺序处理异步操作
      for await (const id of selectedIds) {
        await updateQuestionService(id, {
          isDeleted: false,
        });
      }
    },
    {
      manual: true,
      debounceWait: 500, // 防抖等待时间，单位毫秒
      onSuccess() {
        message.success('恢复成功');
        setSelectedIds([]);
        refresh(); // 手动刷新
      },
    }
  );

  // 彻底删除操作
  const { run: deleteQuestion } = useRequest(
    async () => {
      await deleteQuestionService(selectedIds);
    },
    {
      manual: true,
      debounceWait: 500, // 防抖等待时间，单位毫秒
      onSuccess() {
        message.success('删除成功');
        setSelectedIds([]);
        refresh(); // 手动刷新
      },
    }
  );

  // 处理彻底删除选中问卷的回调
  const onDelete = () => {
    confirm({
      title: '确认删除选中的问卷吗？',
      icon: <ExclamationCircleOutlined />,
      okText: '确认',
      cancelText: '取消',
      okType: 'danger',
      content: '删除后将无法恢复，是否继续？',
      onOk: deleteQuestion,
      onCancel: () => {
        console.log('删除取消');
      },
    });
  };

  // 定义表格部分的JSX
  const TableElem = (
    <>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type="primary"
            disabled={selectedIds.length === 0}
            onClick={recover}
          >
            恢复
          </Button>
          <Button danger onClick={onDelete} disabled={selectedIds.length === 0}>
            彻底删除
          </Button>
        </Space>
      </div>
      {/* 
        rowSelection设置表格复选框 
        columns设置表格列
        dataSource设置表格数据
      */}
      <Table
        dataSource={list}
        columns={questionColumns}
        pagination={false}
        rowKey={(q: QuestionListItem) => q._id}
        rowSelection={{
          type: 'checkbox',
          onChange: (selectedRowKeys) => {
            // console.log(selectedRowKeys);
            setSelectedIds(selectedRowKeys as string[]);
          },
        }}
      />
    </>
  );
  return (
    <>
      <div className={styles.header}>
        <div className={styles.left}>
          <Title level={3}>回收站</Title>
        </div>
        <div className={styles.right}>
          <ListSearch />
        </div>
      </div>
      <div className={styles.content}>
        {loading && (
          <div style={{ textAlign: 'center' }}>
            <Spin />
          </div>
        )}
        {/* 问卷列表 */}
        {!loading && list.length === 0 && <Empty description="暂无数据" />}
        {list.length > 0 && <div className={styles.tableWrap}>{TableElem}</div>}
      </div>
      <div className={styles.footer}>
        <ListPage total={total} />
      </div>
    </>
  );
};

const Trash: FC = () => {
  const { role } = useGetUserInfo();
  const isAdmin = role === 'admin';

  if (isAdmin) {
    return <AdminTrash />;
  }

  return <TrashUser />;
};

export default Trash;
