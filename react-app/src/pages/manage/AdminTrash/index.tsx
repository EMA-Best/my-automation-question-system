import type { FC, MouseEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Row,
  Col,
  Space,
  Table,
  Tooltip,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRequest, useTitle } from 'ahooks';
import {
  getAdminDeletedQuestionListService,
  hardDeleteAdminQuestionService,
  restoreAdminQuestionService,
  type AdminDeletedQuestionListItem,
  type AdminDeletedQuestionListRes,
} from '../../../services/admin';
import { formatDateTime } from '../../../utils/formatDateTime';
import styles from './index.module.scss';

const { Title } = Typography;

type QueryState = {
  keyword: string;
  authorKeyword: string;
  deletedByKeyword: string;
  deleteReasonKeyword: string;
};

const defaultQueryState: QueryState = {
  keyword: '',
  authorKeyword: '',
  deletedByKeyword: '',
  deleteReasonKeyword: '',
};

type ActionType = 'detail' | 'restore' | 'hardDelete';

const AdminTrash: FC = () => {
  useTitle('回收站 | 小伦问卷 · 管理端');

  const [form] = Form.useForm<QueryState>();

  const [queryState, setQueryState] = useState<QueryState>(defaultQueryState);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState('');

  const fetchList = useCallback(async () => {
    const res = await getAdminDeletedQuestionListService({
      page,
      pageSize,
      keyword: queryState.keyword || undefined,
      authorKeyword: queryState.authorKeyword || undefined,
      deletedByKeyword: queryState.deletedByKeyword || undefined,
      deleteReasonKeyword: queryState.deleteReasonKeyword || undefined,
    });

    return res;
  }, [page, pageSize, queryState]);

  const { data, loading, refresh } = useRequest(fetchList, {
    refreshDeps: [page, pageSize, queryState],
  });

  const listData: AdminDeletedQuestionListRes | undefined = data;
  const tableDataSource = useMemo(() => listData?.list ?? [], [listData]);

  const questionById = useMemo(() => {
    const map = new Map<string, AdminDeletedQuestionListItem>();
    tableDataSource.forEach((q) => {
      map.set(q.id, q);
    });
    return map;
  }, [tableDataSource]);

  const total = listData?.count ?? 0;

  const handleQueryClick = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setPage(1);
      setQueryState(values);
    } catch {
      // 表单校验未通过时不触发查询
    }
  }, [form]);

  const handlePressEnterQuery = useCallback(() => {
    void handleQueryClick();
  }, [handleQueryClick]);

  const onReset = useCallback(() => {
    setPage(1);
    form.setFieldsValue(defaultQueryState);
    setQueryState(defaultQueryState);
  }, [form]);

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  const openDetail = useCallback((id: string) => {
    setDetailId(id);
    setDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
  }, []);

  const detailQuestion = useMemo(() => {
    if (!detailId) return null;
    return questionById.get(detailId) ?? null;
  }, [detailId, questionById]);

  const confirmRestore = useCallback(
    (questionIds: string[]) => {
      if (questionIds.length === 0) return;
      Modal.confirm({
        title: `确认恢复 ${questionIds.length} 份问卷？`,
        content: '恢复后会回到问卷列表。',
        okText: '恢复',
        cancelText: '取消',
        onOk: async () => {
          try {
            for await (const id of questionIds) {
              await restoreAdminQuestionService(id);
            }
            message.success('已恢复');
            setSelectedIds([]);
            refresh();
          } catch {
            // 错误提示由 ajax 拦截器统一处理，这里吞掉避免页面报错
          }
        },
      });
    },
    [refresh]
  );

  const confirmHardDelete = useCallback(
    (questionIds: string[]) => {
      if (questionIds.length === 0) return;
      Modal.confirm({
        title: `确认永久删除 ${questionIds.length} 份问卷？`,
        content: '永久删除后将无法恢复，请谨慎操作。',
        okText: '永久删除',
        okButtonProps: { danger: true },
        cancelText: '取消',
        onOk: async () => {
          try {
            for await (const id of questionIds) {
              await hardDeleteAdminQuestionService(id);
            }
            message.success('已永久删除');
            setSelectedIds([]);
            refresh();
          } catch {
            // 错误提示由 ajax 拦截器统一处理，这里吞掉避免页面报错
          }
        },
      });
    },
    [refresh]
  );

  const handleActionClick = useCallback(
    (evt: MouseEvent<HTMLElement>) => {
      const { action, id } = (evt.currentTarget as HTMLElement).dataset;
      if (!action || !id) return;

      const typedAction = action as ActionType;
      if (typedAction === 'detail') {
        openDetail(id);
        return;
      }
      if (typedAction === 'restore') {
        confirmRestore([id]);
        return;
      }
      if (typedAction === 'hardDelete') {
        confirmHardDelete([id]);
      }
    },
    [confirmHardDelete, confirmRestore, openDetail]
  );

  const onTablePageChange = useCallback(
    (nextPage: number, nextPageSize: number) => {
      setPage(nextPage);
      setPageSize(nextPageSize);
    },
    []
  );

  const tableScroll = useMemo(() => {
    return { x: 1250 };
  }, []);

  const columns = useMemo<ColumnsType<AdminDeletedQuestionListItem>>(() => {
    return [
      {
        title: '序号',
        key: 'index',
        width: 80,
        render: (_, __, index) => (page - 1) * pageSize + index + 1,
      },
      {
        title: '问卷标题',
        dataIndex: 'title',
        key: 'title',
        width: 260,
        ellipsis: { showTitle: false },
        render: (value: string) => {
          const text = value || '-';
          if (text === '-') return <span>-</span>;
          return (
            <Tooltip title={text} placement="topLeft">
              <span className={styles.ellipsisText}>{text}</span>
            </Tooltip>
          );
        },
      },
      {
        title: '作者',
        dataIndex: 'author',
        key: 'author',
        width: 140,
        ellipsis: true,
      },
      {
        title: '删除人',
        key: 'deletedBy',
        width: 140,
        render: (_, row) => {
          const deletedByText =
            row.deletedBy.nickname || row.deletedBy.username || '-';
          return <span>{deletedByText}</span>;
        },
      },
      {
        title: '删除原因',
        dataIndex: 'deleteReason',
        key: 'deleteReason',
        width: 220,
        ellipsis: true,
        render: (value: string) => value || '-',
      },
      {
        title: '删除时间',
        dataIndex: 'deletedAt',
        key: 'deletedAt',
        width: 170,
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 170,
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '操作',
        key: 'action',
        width: 170,
        render: (_, row) => {
          return (
            <Space size={4} wrap>
              <Button
                type="link"
                data-action="detail"
                data-id={row.id}
                onClick={handleActionClick}
              >
                详情
              </Button>
              <Button
                type="link"
                data-action="restore"
                data-id={row.id}
                onClick={handleActionClick}
              >
                恢复
              </Button>
              <Button
                danger
                type="link"
                data-action="hardDelete"
                data-id={row.id}
                onClick={handleActionClick}
              >
                永久删除
              </Button>
            </Space>
          );
        },
      },
    ];
  }, [handleActionClick, page, pageSize]);

  const tablePagination = useMemo(() => {
    return {
      current: page,
      pageSize,
      total,
      showSizeChanger: true,
      onChange: onTablePageChange,
    };
  }, [onTablePageChange, page, pageSize, total]);

  const headerActions = useMemo(() => {
    return (
      <Space wrap>
        <Button onClick={onRefresh} disabled={loading}>
          刷新
        </Button>
        <Button
          type="primary"
          onClick={() => confirmRestore(selectedIds)}
          disabled={selectedIds.length === 0}
        >
          批量恢复
        </Button>
        <Button
          danger
          onClick={() => confirmHardDelete(selectedIds)}
          disabled={selectedIds.length === 0}
        >
          批量永久删除
        </Button>
      </Space>
    );
  }, [confirmHardDelete, confirmRestore, loading, onRefresh, selectedIds]);

  return (
    <Space direction="vertical" size={16} className={styles.page}>
      <Card>
        <Title level={3} className={styles.headerTitle}>
          回收站
        </Title>
      </Card>

      <Card>
        <Form<QueryState>
          form={form}
          layout="vertical"
          initialValues={defaultQueryState}
          className={styles.queryForm}
        >
          <Row gutter={[16, 12]} align="bottom">
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="keyword" label="关键词">
                <Input
                  placeholder="标题/ID"
                  allowClear
                  className={styles.field}
                  onPressEnter={handlePressEnterQuery}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="authorKeyword" label="作者">
                <Input
                  placeholder="author（如 mikasa）"
                  allowClear
                  className={styles.field}
                  onPressEnter={handlePressEnterQuery}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="deletedByKeyword" label="删除人">
                <Input
                  placeholder="用户名/昵称"
                  allowClear
                  className={styles.field}
                  onPressEnter={handlePressEnterQuery}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item name="deleteReasonKeyword" label="删除原因">
                <Input
                  placeholder="原因关键词"
                  allowClear
                  className={styles.field}
                  onPressEnter={handlePressEnterQuery}
                />
              </Form.Item>
            </Col>

            <Col xs={24} className={styles.actionCol}>
              <Form.Item>
                <Space size={12} wrap>
                  <Button type="primary" onClick={handleQueryClick}>
                    查询
                  </Button>
                  <Button onClick={onReset} disabled={loading}>
                    重置
                  </Button>
                  {headerActions}
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
        <Table<AdminDeletedQuestionListItem>
          rowKey={(row) => row.id}
          loading={loading}
          columns={columns}
          dataSource={tableDataSource}
          tableLayout="fixed"
          scroll={tableScroll}
          pagination={tablePagination}
          rowSelection={{
            type: 'checkbox',
            selectedRowKeys: selectedIds,
            onChange: (keys) => {
              setSelectedIds(keys.map(String));
            },
          }}
        />
      </Card>

      <Drawer
        title="问卷删除详情"
        open={detailOpen}
        onClose={closeDetail}
        width={520}
        destroyOnClose
        extra={
          detailQuestion ? (
            <Space>
              <Button onClick={() => confirmRestore([detailQuestion.id])}>
                恢复
              </Button>
              <Button
                danger
                onClick={() => confirmHardDelete([detailQuestion.id])}
              >
                永久删除
              </Button>
            </Space>
          ) : null
        }
      >
        {detailQuestion ? (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="ID">
              {detailQuestion.id}
            </Descriptions.Item>
            <Descriptions.Item label="标题">
              {detailQuestion.title}
            </Descriptions.Item>
            <Descriptions.Item label="删除原因">
              {detailQuestion.deleteReason || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="删除人">
              {detailQuestion.deletedBy.nickname ||
                detailQuestion.deletedBy.username ||
                '-'}
            </Descriptions.Item>
            <Descriptions.Item label="删除时间">
              {formatDateTime(detailQuestion.deletedAt)}
            </Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {formatDateTime(detailQuestion.createdAt)}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </Space>
  );
};

export default AdminTrash;
