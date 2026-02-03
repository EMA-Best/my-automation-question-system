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
  Select,
  Space,
  Table,
  Tag,
  Typography,
  Tooltip,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRequest, useTitle } from 'ahooks';
import {
  getAdminQuestionListService,
  publishAdminQuestionService,
  softDeleteAdminQuestionService,
  unpublishAdminQuestionService,
  updateAdminQuestionFeatureService,
  type AdminQuestionListItem,
  type AdminQuestionListRes,
  type AuditStatus,
} from '../../../services/admin';
import styles from './index.module.scss';
import { formatDateTime } from '../../../utils/formatDateTime';

const { Title } = Typography;

type QueryState = {
  keyword: string;
  authorKeyword: string;
  isPublished?: boolean;
  auditStatus?: AuditStatus;
  feature?: 'featured' | 'pinned';
};

const defaultQueryState: QueryState = {
  keyword: '',
  authorKeyword: '',
  isPublished: undefined,
  auditStatus: undefined,
  feature: undefined,
};

const auditStatusColorMap: Record<AuditStatus, string> = {
  Draft: 'default',
  PendingReview: 'processing',
  Approved: 'success',
  Rejected: 'error',
};

const auditStatusTextMap: Record<AuditStatus, string> = {
  Draft: '草稿',
  PendingReview: '待审核',
  Approved: '已通过',
  Rejected: '已驳回',
};

export type AdminQuestionsProps = {
  pageTitle?: string;
  headerTitle?: string;
  defaultQuery?: Partial<QueryState>;
};

const AdminQuestions: FC<AdminQuestionsProps> = (props) => {
  const pageTitle = props.pageTitle ?? '小伦问卷 - 问卷管理';
  const headerTitle = props.headerTitle ?? '问卷管理';
  const defaultQuery = props.defaultQuery;

  useTitle(pageTitle);

  const [form] = Form.useForm<QueryState>();

  const initialQueryState = useMemo<QueryState>(() => {
    return {
      ...defaultQueryState,
      ...(defaultQuery ?? {}),
    };
  }, [defaultQuery]);

  const [queryState, setQueryState] = useState<QueryState>(initialQueryState);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailId, setDetailId] = useState<string>('');

  const fetchList = useCallback(async () => {
    const { feature, ...restQuery } = queryState;
    const res = await getAdminQuestionListService({
      page,
      pageSize,
      ...restQuery,
      featured: feature === 'featured' ? true : undefined,
      pinned: feature === 'pinned' ? true : undefined,
    });
    return res;
  }, [page, pageSize, queryState]);

  const { data, loading, refresh } = useRequest(fetchList, {
    refreshDeps: [page, pageSize, queryState],
  });

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
    form.setFieldsValue(initialQueryState);
    setQueryState(initialQueryState);
  }, [form, initialQueryState]);

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  // console.log('data: ', data);

  const listData: AdminQuestionListRes | undefined = data;

  const tableDataSource = useMemo(() => {
    return listData?.list ?? [];
  }, [listData]);

  // console.log('tableDataSource: ', tableDataSource);

  const questionById = useMemo(() => {
    const map = new Map<string, AdminQuestionListItem>();
    tableDataSource.forEach((q) => {
      map.set(q.id, q);
    });
    return map;
  }, [tableDataSource]);

  const total = listData?.count ?? 0;

  type ActionType =
    | 'detail'
    | 'publish'
    | 'unpublish'
    | 'togglePinned'
    | 'toggleFeatured'
    | 'softDelete';

  type DeleteFormState = {
    reason: string;
  };

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [deleteTitle, setDeleteTitle] = useState('');
  const [deleteForm] = Form.useForm<DeleteFormState>();

  const openDeleteModal = useCallback(
    (id: string, title: string) => {
      setDeleteId(id);
      setDeleteTitle(title);
      setDeleteOpen(true);
      deleteForm.setFieldsValue({ reason: '' });
    },
    [deleteForm]
  );

  const closeDeleteModal = useCallback(() => {
    setDeleteOpen(false);
  }, []);

  const handleDeleteOk = useCallback(async () => {
    if (!deleteId) return;
    try {
      const values = await deleteForm.validateFields();
      await softDeleteAdminQuestionService(deleteId, {
        reason: values.reason,
      });
      message.success('已移入回收站');
      setDeleteOpen(false);
      refresh();
    } catch {
      // 表单校验失败 or 请求失败时不关闭弹窗；错误提示由 ajax 拦截器统一处理
    }
  }, [deleteForm, deleteId, refresh]);

  const handleActionClick = useCallback(
    (evt: MouseEvent<HTMLElement>) => {
      const { action, id } = (evt.currentTarget as HTMLElement).dataset;
      if (!action || !id) return;

      const row = questionById.get(id);
      if (!row) return;

      const typedAction = action as ActionType;

      if (typedAction === 'detail') {
        setDetailId(id);
        setDetailOpen(true);
        return;
      }

      if (typedAction === 'softDelete') {
        openDeleteModal(id, row.title);
        return;
      }

      if (typedAction === 'publish') {
        Modal.confirm({
          title: '确认发布该问卷？',
          content: '这将强制发布该问卷。',
          okText: '发布',
          cancelText: '取消',
          onOk: async () => {
            try {
              await publishAdminQuestionService(id);
              message.success('已发布');
              refresh();
            } catch {
              // 错误提示由 ajax 拦截器统一处理，这里吞掉避免页面报错
            }
          },
        });
        return;
      }

      if (typedAction === 'unpublish') {
        Modal.confirm({
          title: '确认下架该问卷？',
          content: '这将强制下架该问卷。',
          okText: '下架',
          okButtonProps: { danger: true },
          cancelText: '取消',
          onOk: async () => {
            try {
              await unpublishAdminQuestionService(id);
              message.success('已下架');
              refresh();
            } catch {
              // 错误提示由 ajax 拦截器统一处理，这里吞掉避免页面报错
            }
          },
        });
        return;
      }

      if (typedAction === 'togglePinned') {
        if (!row.isPublished) {
          message.warning('未发布问卷不支持置顶，请先发布');
          return;
        }
        const nextPinned = !row.pinned;
        Modal.confirm({
          title: nextPinned ? '确认置顶该问卷？' : '确认取消置顶？',
          okText: nextPinned ? '置顶' : '取消置顶',
          cancelText: '取消',
          onOk: async () => {
            try {
              await updateAdminQuestionFeatureService(id, {
                pinned: nextPinned,
              });
              message.success(nextPinned ? '已置顶' : '已取消置顶');
              refresh();
            } catch {
              // 错误提示由 ajax 拦截器统一处理，这里吞掉避免页面报错
            }
          },
        });
        return;
      }

      if (typedAction === 'toggleFeatured') {
        if (!row.isPublished) {
          message.warning('未发布问卷不支持推荐，请先发布');
          return;
        }
        const nextFeatured = !row.featured;
        Modal.confirm({
          title: nextFeatured ? '确认推荐该问卷？' : '确认取消推荐？',
          okText: nextFeatured ? '推荐' : '取消推荐',
          cancelText: '取消',
          onOk: async () => {
            try {
              await updateAdminQuestionFeatureService(id, {
                featured: nextFeatured,
              });
              message.success(nextFeatured ? '已推荐' : '已取消推荐');
              refresh();
            } catch {
              // 错误提示由 ajax 拦截器统一处理，这里吞掉避免页面报错
            }
          },
        });
      }
    },
    [openDeleteModal, questionById, refresh]
  );

  const handleCloseDetail = useCallback(() => {
    setDetailOpen(false);
  }, []);

  const detailQuestion = useMemo(() => {
    if (!detailId) return null;
    return questionById.get(detailId) ?? null;
  }, [detailId, questionById]);

  const detailAnswerCount = detailQuestion?.answerCount ?? 0;

  const columns = useMemo<ColumnsType<AdminQuestionListItem>>(() => {
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
        title: '标题',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
      },
      {
        title: '作者',
        dataIndex: 'author',
        key: 'author',
        ellipsis: true,
      },
      {
        title: '状态',
        key: 'status',
        render: (_, row) => {
          const publishTag = row.isPublished ? (
            <Tag color="blue">已发布</Tag>
          ) : (
            <Tag>未发布</Tag>
          );
          const auditColor = auditStatusColorMap[row.auditStatus];
          const auditText = auditStatusTextMap[row.auditStatus];
          return (
            <Space size={4} wrap>
              {publishTag}
              <Tag color={auditColor}>{auditText}</Tag>
              {row.pinned ? <Tag color="gold">置顶</Tag> : null}
              {row.featured ? <Tag color="purple">推荐</Tag> : null}
            </Space>
          );
        },
      },
      {
        title: '答卷',
        dataIndex: 'answerCount',
        key: 'answerCount',
        width: 90,
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '操作',
        key: 'action',
        width: 320,
        render: (_, row) => {
          const publishAction: ActionType = row.isPublished
            ? 'unpublish'
            : 'publish';
          const publishText = row.isPublished ? '下架' : '发布';
          const pinnedText = row.pinned ? '取消置顶' : '置顶';
          const featuredText = row.featured ? '取消推荐' : '推荐';
          const disableOperateWhenUnpublished = !row.isPublished;
          const operateDisabledTip = '未发布问卷不支持该操作，请先发布';

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
                data-action={publishAction}
                data-id={row.id}
                onClick={handleActionClick}
              >
                {publishText}
              </Button>
              <Button
                danger
                type="link"
                data-action="softDelete"
                data-id={row.id}
                onClick={handleActionClick}
              >
                删除
              </Button>
              <Button
                type="link"
                data-action="togglePinned"
                data-id={row.id}
                onClick={handleActionClick}
                disabled={disableOperateWhenUnpublished}
              >
                <Tooltip
                  title={
                    disableOperateWhenUnpublished ? operateDisabledTip : null
                  }
                >
                  <span>{pinnedText}</span>
                </Tooltip>
              </Button>
              <Button
                type="link"
                data-action="toggleFeatured"
                data-id={row.id}
                onClick={handleActionClick}
                disabled={disableOperateWhenUnpublished}
              >
                <Tooltip
                  title={
                    disableOperateWhenUnpublished ? operateDisabledTip : null
                  }
                >
                  <span>{featuredText}</span>
                </Tooltip>
              </Button>
            </Space>
          );
        },
      },
    ];
  }, [handleActionClick, page, pageSize]);

  return (
    <Space direction="vertical" size={16} className={styles.page}>
      <Card>
        <Title level={3} className={styles.headerTitle}>
          {headerTitle}
        </Title>
      </Card>

      <Card>
        <Form<QueryState>
          form={form}
          layout="vertical"
          initialValues={initialQueryState}
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
                  placeholder="author"
                  allowClear
                  className={styles.field}
                  onPressEnter={handlePressEnterQuery}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8} lg={4}>
              <Form.Item name="isPublished" label="发布">
                <Select
                  allowClear
                  placeholder="全部"
                  className={styles.field}
                  options={[
                    { label: '已发布', value: true },
                    { label: '未发布', value: false },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8} lg={4}>
              <Form.Item name="auditStatus" label="审核">
                <Select
                  allowClear
                  placeholder="全部"
                  className={styles.field}
                  options={[
                    { label: '草稿', value: 'Draft' },
                    { label: '待审核', value: 'PendingReview' },
                    { label: '已通过', value: 'Approved' },
                    { label: '已驳回', value: 'Rejected' },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8} lg={4}>
              <Form.Item name="feature" label="运营">
                <Select
                  allowClear
                  placeholder="全部"
                  className={styles.field}
                  options={[
                    { label: '推荐', value: 'featured' },
                    { label: '置顶', value: 'pinned' },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} className={styles.actionCol}>
              <Form.Item>
                <Space size={12} wrap>
                  <Button
                    type="primary"
                    onClick={handleQueryClick}
                    loading={loading}
                  >
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
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
        <Table<AdminQuestionListItem>
          rowKey={(row) => row.id}
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

      <Drawer
        title="问卷详情"
        open={detailOpen}
        width={520}
        onClose={handleCloseDetail}
        destroyOnClose
      >
        {detailQuestion ? (
          <Descriptions
            bordered
            size="small"
            column={1}
            items={[
              {
                key: 'title',
                label: '标题',
                children: detailQuestion.title || '-',
              },
              {
                key: 'id',
                label: 'ID',
                children: detailQuestion.id,
              },
              {
                key: 'author',
                label: '作者',
                children: detailQuestion.author || '-',
              },
              {
                key: 'status',
                label: '状态',
                children: (
                  <Space size={6} wrap>
                    {detailQuestion.isPublished ? (
                      <Tag color="blue">已发布</Tag>
                    ) : (
                      <Tag>未发布</Tag>
                    )}
                    <Tag
                      color={auditStatusColorMap[detailQuestion.auditStatus]}
                    >
                      {auditStatusTextMap[detailQuestion.auditStatus]}
                    </Tag>
                    {detailQuestion.pinned ? (
                      <Tag color="gold">置顶</Tag>
                    ) : null}
                    {detailQuestion.featured ? (
                      <Tag color="purple">推荐</Tag>
                    ) : null}
                  </Space>
                ),
              },
              {
                key: 'answerCount',
                label: '答卷数',
                children: detailAnswerCount,
              },
              {
                key: 'createdAt',
                label: '创建时间',
                children: formatDateTime(detailQuestion.createdAt),
              },
            ]}
          />
        ) : (
          <span>-</span>
        )}
      </Drawer>

      <Modal
        title="删除问卷（进回收站）"
        open={deleteOpen}
        onCancel={closeDeleteModal}
        onOk={handleDeleteOk}
        okText="删除"
        okButtonProps={{ danger: true }}
        cancelText="取消"
        destroyOnClose
      >
        <Space direction="vertical" size={12} className={styles.modalBody}>
          <div>
            将 <strong>{deleteTitle || '该问卷'}</strong> 移入回收站。
          </div>
          <Form<DeleteFormState> form={deleteForm} layout="vertical">
            <Form.Item
              name="reason"
              label="删除原因"
              rules={[{ required: true, message: '请输入删除原因' }]}
            >
              <Input.TextArea
                placeholder="请输入删除原因（用于审计与追溯）"
                maxLength={200}
                showCount
                autoSize={{ minRows: 3, maxRows: 6 }}
              />
            </Form.Item>
          </Form>
        </Space>
      </Modal>
    </Space>
  );
};

export default AdminQuestions;
