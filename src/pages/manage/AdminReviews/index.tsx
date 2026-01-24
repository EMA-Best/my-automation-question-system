import type { FC } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  Card,
  Drawer,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRequest, useTitle } from 'ahooks';
import {
  approveAdminReviewService,
  getAdminQuestionDetailService,
  getAdminReviewListService,
  rejectAdminReviewService,
  type AdminReviewListItem,
  type AdminReviewListRes,
  type ReviewStatus,
} from '../../../services/admin';
import { getComponentConfigByType } from '../../../components/QuestionComponents';
import type { ComponentInfoType } from '../../../store/componentsReducer';
import { formatDateTime } from '../../../utils/formatDateTime';
import styles from './index.module.scss';

const { Title } = Typography;

type QueryState = {
  keyword: string;
  status?: ReviewStatus;
};

const defaultQueryState: QueryState = {
  keyword: '',
};

const statusColorMap: Record<ReviewStatus, string> = {
  PendingReview: 'processing',
  Approved: 'success',
  Rejected: 'error',
};

const statusTextMap: Record<ReviewStatus, string> = {
  PendingReview: '待审核',
  Approved: '已通过',
  Rejected: '已驳回',
};

const AdminReviews: FC = () => {
  useTitle('小伦问卷 - 管理后台 - 审核队列');

  const [form] = Form.useForm<QueryState>();
  const [queryState, setQueryState] = useState<QueryState>({
    ...defaultQueryState,
    status: 'PendingReview',
  });
  const [queryVersion, setQueryVersion] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchList = useCallback(async () => {
    const res = await getAdminReviewListService({
      page,
      pageSize,
      ...queryState,
    });
    return res;
  }, [page, pageSize, queryState]);

  const { data, loading, refresh } = useRequest(fetchList, {
    refreshDeps: [page, pageSize, queryState, queryVersion],
  });

  const applyQuery = useCallback((values: QueryState) => {
    setPage(1);
    setQueryState(values);
    setQueryVersion((v) => v + 1);
  }, []);

  const onQuery = useCallback(async () => {
    const values = await form.validateFields();
    applyQuery(values);
  }, [applyQuery, form]);

  const onFinish = useCallback(
    (values: QueryState) => {
      applyQuery(values);
    },
    [applyQuery]
  );

  const onReset = useCallback(() => {
    const next: QueryState = { ...defaultQueryState, status: 'PendingReview' };
    form.setFieldsValue(next);
    applyQuery(next);
  }, [applyQuery, form]);

  const onRefresh = useCallback(() => {
    // 即使查询条件不变，也强制触发一次重新请求
    setQueryVersion((v) => v + 1);
    refresh();
  }, [refresh]);

  const [previewOpen, setPreviewOpen] = useState(false);

  const {
    data: previewData,
    loading: previewLoading,
    run: loadPreview,
  } = useRequest(
    async (questionId: string) => {
      const res = await getAdminQuestionDetailService(questionId);
      return res;
    },
    {
      manual: true,
      onError: (err) => {
        message.error(err.message || '加载问卷预览失败');
      },
    }
  );

  const openPreview = useCallback(
    (questionId: string) => {
      setPreviewOpen(true);
      loadPreview(questionId);
    },
    [loadPreview]
  );

  const closePreview = useCallback(() => {
    setPreviewOpen(false);
  }, []);

  const renderComponent = useCallback((componentInfo: ComponentInfoType) => {
    const componentConf = getComponentConfigByType(componentInfo.type);
    if (!componentConf) return null;
    const { Component } = componentConf;
    return <Component {...componentInfo.props} />;
  }, []);

  const previewComponentList = useMemo(() => {
    const list = previewData?.componentList ?? [];
    return list.filter((c) => !c.isHidden);
  }, [previewData]);

  const [approveOpen, setApproveOpen] = useState(false);
  const [approveId, setApproveId] = useState<string>('');
  const [autoPublish, setAutoPublish] = useState(false);

  const { loading: approving, run: runApprove } = useRequest(
    async () => {
      if (!approveId) return;
      await approveAdminReviewService(approveId, { autoPublish });
    },
    {
      manual: true,
      onSuccess: () => {
        setApproveOpen(false);
        setAutoPublish(false);
        refresh();
      },
    }
  );

  const openApprove = useCallback((questionId: string) => {
    setApproveId(questionId);
    setApproveOpen(true);
  }, []);

  const closeApprove = useCallback(() => {
    setApproveOpen(false);
    setAutoPublish(false);
  }, []);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectId, setRejectId] = useState<string>('');
  const [rejectForm] = Form.useForm<{ reason: string }>();

  const { loading: rejecting, run: runReject } = useRequest(
    async (reason: string) => {
      if (!rejectId) return;
      await rejectAdminReviewService(rejectId, { reason });
    },
    {
      manual: true,
      onSuccess: () => {
        setRejectOpen(false);
        rejectForm.resetFields();
        refresh();
      },
    }
  );

  const openReject = useCallback(
    (questionId: string) => {
      setRejectId(questionId);
      setRejectOpen(true);
      rejectForm.setFieldsValue({ reason: '' });
    },
    [rejectForm]
  );

  const closeReject = useCallback(() => {
    setRejectOpen(false);
    rejectForm.resetFields();
  }, [rejectForm]);

  const handleRejectOk = useCallback(async () => {
    const values = await rejectForm.validateFields();
    runReject(values.reason);
  }, [rejectForm, runReject]);

  const columns = useMemo<ColumnsType<AdminReviewListItem>>(() => {
    return [
      {
        title: '序号',
        key: 'index',
        width: 80,
        align: 'center',
        render: (_value, _row, index) => {
          return <span>{(page - 1) * pageSize + index + 1}</span>;
        },
      },
      {
        title: '问卷标题',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        render: (_, row) => {
          return <span>{row.title || row.questionId || '-'}</span>;
        },
      },
      {
        title: '提交人',
        key: 'owner',
        render: (_, row) => {
          const { nickname, username } = row.owner ?? {};
          return <span>{nickname || username || '-'}</span>;
        },
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (status: ReviewStatus) => {
          const color = statusColorMap[status];
          const text = statusTextMap[status];
          return <Tag color={color}>{text}</Tag>;
        },
      },
      {
        title: '提交时间',
        dataIndex: 'submittedAt',
        key: 'submittedAt',
        width: 180,
        render: (submittedAt: string) => {
          return <span>{formatDateTime(submittedAt)}</span>;
        },
      },
      {
        title: '操作',
        key: 'action',
        width: 220,
        render: (_, row) => {
          return (
            <Space>
              <Button type="link" onClick={() => openPreview(row.questionId)}>
                预览
              </Button>
              <Button type="link" onClick={() => openApprove(row.questionId)}>
                通过
              </Button>
              <Button
                type="link"
                danger
                onClick={() => openReject(row.questionId)}
              >
                驳回
              </Button>
            </Space>
          );
        },
      },
    ];
  }, [openApprove, openPreview, openReject, page, pageSize]);

  const listData: AdminReviewListRes | undefined = data;

  const tableDataSource = useMemo(() => {
    return listData?.list ?? [];
  }, [listData]);

  const total = listData?.count ?? 0;

  return (
    <>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Card>
          <Title level={3} style={{ margin: 0 }}>
            审核队列
          </Title>
        </Card>

        <Card>
          <Form<QueryState>
            form={form}
            layout="inline"
            initialValues={{ ...defaultQueryState, status: 'PendingReview' }}
            onFinish={onFinish}
          >
            <Form.Item name="keyword" label="关键词">
              <Input
                placeholder="标题/ID"
                allowClear
                style={{ width: 220 }}
                onPressEnter={onQuery}
              />
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select
                allowClear
                placeholder="全部"
                style={{ width: 160 }}
                options={[
                  { label: '待审核', value: 'PendingReview' },
                  { label: '已通过', value: 'Approved' },
                  { label: '已驳回', value: 'Rejected' },
                ]}
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" onClick={onQuery} loading={loading}>
                  查询
                </Button>
                <Button onClick={onReset} disabled={loading}>
                  重置
                </Button>
                <Button onClick={onRefresh} disabled={loading}>
                  刷新
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        <Card>
          <Table<AdminReviewListItem>
            rowKey={(row) => row.questionId}
            loading={loading}
            columns={columns}
            dataSource={tableDataSource}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              onChange: (nextPage, nextPageSize) => {
                setPage(nextPage);
                setPageSize(nextPageSize);
              },
            }}
          />
        </Card>
      </Space>

      <Drawer
        title="问卷预览"
        open={previewOpen}
        width={720}
        onClose={closePreview}
        destroyOnClose={true}
      >
        <Card
          loading={previewLoading}
          bordered={false}
          className={styles.previewCard}
        >
          <div className={styles.previewContent}>
            {previewComponentList.map((c) => (
              <div key={c.fe_id} className={styles.previewBlock}>
                {renderComponent(c)}
              </div>
            ))}
            {!previewLoading && previewComponentList.length === 0 ? (
              <Typography.Text type="secondary">
                该问卷暂无可预览的组件
              </Typography.Text>
            ) : null}
          </div>
        </Card>
      </Drawer>

      <Modal
        title="审核通过"
        open={approveOpen}
        onOk={runApprove}
        confirmLoading={approving}
        onCancel={closeApprove}
        okText="通过"
        cancelText="取消"
        destroyOnClose={true}
      >
        <Checkbox
          checked={autoPublish}
          onChange={(e) => setAutoPublish(e.target.checked)}
        >
          通过并发布（autoPublish）
        </Checkbox>
      </Modal>

      <Modal
        title="驳回审核"
        open={rejectOpen}
        onOk={handleRejectOk}
        confirmLoading={rejecting}
        onCancel={closeReject}
        okText="驳回"
        cancelText="取消"
        destroyOnClose={true}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reason"
            label="驳回原因"
            rules={[{ required: true, message: '请输入驳回原因' }]}
          >
            <Input.TextArea placeholder="请输入驳回原因" rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AdminReviews;
