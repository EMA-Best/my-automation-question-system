/**
 * @file 管理员 - 模板管理页面
 * @description 对应文档 §4.1.1（页面与路由），提供模板的列表查看、创建、发布/下线、删除等管理能力。
 *
 * 页面结构：
 *  ┌─ 查询表单（关键词 + 模板状态筛选）
 *  ├─ 操作栏（新建模板 + 刷新）
 *  ├─ 模板列表（Table 分页）
 *  └─ 创建模板弹窗（Modal）
 *
 * 核心设计决策（与文档对齐）：
 *  1. 模板管理页仅 admin 可见（由路由层 + Access 组件控制）。
 *  2. 列表展示 draft + published 所有状态的模板（文档 §3.3.1）。
 *  3. "发布"操作对应后端 POST /api/admin/templates/:id/publish。
 *  4. "下线"操作对应后端 POST /api/admin/templates/:id/unpublish。
 *  5. 操作按钮通过 data-* 属性做事件委托，减少闭包开销（复用 AdminQuestions 模式）。
 */

import type { FC, MouseEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Drawer,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EditOutlined,
  SendOutlined,
  StopOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useRequest, useTitle } from 'ahooks';
import { getComponentConfigByType } from '../../../components/QuestionComponents';
import type { ComponentInfoType } from '../../../store/componentsReducer';
import {
  getAdminTemplateDetailService,
  getAdminTemplateListService,
  publishAdminTemplateService,
  unpublishAdminTemplateService,
  deleteAdminTemplateService,
} from '../../../services/template';
import type { AdminTemplateListItem } from '../../../types/template';
import type { TemplateStatus } from '../../../types/template';
import { formatDateTime } from '../../../utils/formatDateTime';
import styles from './index.module.scss';

const { Title } = Typography;

// ─── 模板状态 → 颜色/文案映射 ─────────────────────────────

/** 模板状态对应的 Tag 颜色 */
const templateStatusColorMap: Record<TemplateStatus, string> = {
  draft: 'default',
  published: 'success',
};

/** 模板状态对应的中文文案 */
const templateStatusTextMap: Record<TemplateStatus, string> = {
  draft: '草稿',
  published: '已发布',
};

// ─── 查询表单的类型 ───────────────────────────────────────

/** 查询表单状态 */
type QueryState = {
  /** 搜索关键词（标题/描述） */
  keyword: string;
  /** 模板发布状态筛选 */
  templateStatus?: TemplateStatus;
};

/** 默认查询状态 */
const defaultQueryState: QueryState = {
  keyword: '',
  templateStatus: undefined,
};

// ─── 操作类型（事件委托用） ───────────────────────────────

/** 表格行操作的枚举 */
type ActionType = 'edit' | 'preview' | 'publish' | 'unpublish' | 'delete';

// ─── 组件 Props ───────────────────────────────────────────

export type AdminTemplatesProps = {
  /** 浏览器标签页标题 */
  pageTitle?: string;
  /** 页面标题（显示在顶部） */
  headerTitle?: string;
};

/**
 * 管理员模板管理页面组件
 *
 * 复用了 AdminQuestions 的交互模式：
 * - 查询表单 + 分页表格
 * - 操作按钮通过 data-action / data-id 做事件委托
 * - 危险操作（发布/下线/删除）使用 Modal.confirm 二次确认
 */
const AdminTemplates: FC<AdminTemplatesProps> = (props) => {
  // ── 页面标题 ──────────────────────────────────────────
  const pageTitle = props.pageTitle ?? '小伦问卷 - 模板管理';
  const headerTitle = props.headerTitle ?? '模板管理';
  useTitle(pageTitle);

  // ── 查询表单 ──────────────────────────────────────────
  const [form] = Form.useForm<QueryState>();
  const [queryState, setQueryState] = useState<QueryState>(defaultQueryState);

  // ── 分页状态 ──────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── 数据请求：获取模板列表 ───────────────────────────
  /**
   * 封装列表请求逻辑
   * refreshDeps 确保页码/每页条数/查询条件变化时自动重新请求
   */
  const fetchList = useCallback(async () => {
    const res = await getAdminTemplateListService({
      page,
      pageSize,
      keyword: queryState.keyword || undefined,
      templateStatus: queryState.templateStatus,
    });
    return res;
  }, [page, pageSize, queryState]);

  const { data, loading, refresh } = useRequest(fetchList, {
    refreshDeps: [page, pageSize, queryState],
  });

  // ── 派生数据 ──────────────────────────────────────────
  /** 表格数据源 */
  const tableDataSource = useMemo(() => data?.list ?? [], [data]);

  /** 构建 id → 行数据 的快速查找 Map */
  const templateById = useMemo(() => {
    const map = new Map<string, AdminTemplateListItem>();
    tableDataSource.forEach((t) => map.set(t.id, t));
    return map;
  }, [tableDataSource]);

  /** 总条数 */
  const total = data?.count ?? 0;

  // ── 预览抽屉 ───────────────────────────────────────────
  const [previewOpen, setPreviewOpen] = useState(false);

  const {
    data: previewData,
    loading: previewLoading,
    run: loadPreview,
  } = useRequest(
    async (templateId: string) => {
      const res = await getAdminTemplateDetailService(templateId);
      return res;
    },
    {
      manual: true,
      onError: (err) => {
        message.error(err.message || '加载模板预览失败');
      },
    }
  );

  const openPreview = useCallback(
    (templateId: string) => {
      setPreviewOpen(true);
      loadPreview(templateId);
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

  // ── 查询表单交互 ─────────────────────────────────────

  /** 点击"查询"按钮 */
  const handleQueryClick = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setPage(1); // 查询时重置到第一页
      setQueryState(values);
    } catch {
      // 表单校验未通过时不触发查询
    }
  }, [form]);

  /** 回车触发查询 */
  const handlePressEnterQuery = useCallback(() => {
    void handleQueryClick();
  }, [handleQueryClick]);

  /** 点击"重置" */
  const onReset = useCallback(() => {
    setPage(1);
    form.setFieldsValue(defaultQueryState);
    setQueryState(defaultQueryState);
  }, [form]);

  // ── 表格行操作（事件委托） ───────────────────────────
  /**
   * 统一的操作处理器
   *
   * 通过 data-action 和 data-id 属性识别点击了哪个操作，
   * 避免为每行每个按钮创建闭包，减少不必要的 re-render。
   */
  const handleActionClick = useCallback(
    (evt: MouseEvent<HTMLElement>) => {
      const { action, id } = (evt.currentTarget as HTMLElement).dataset;
      if (!action || !id) return;

      const row = templateById.get(id);
      if (!row) return;

      const typedAction = action as ActionType;

      // ── 编辑模板：进入完整编辑页（支持结构编辑） ──
      if (typedAction === 'edit') {
        window.open(`/question/edit/${id}?mode=template`, '_blank');
        return;
      }

      // ── 预览模板 ──
      if (typedAction === 'preview') {
        openPreview(id);
        return;
      }

      // ── 发布模板（draft → published） ──
      if (typedAction === 'publish') {
        Modal.confirm({
          title: '确认发布该模板？',
          content: `模板「${row.title}」发布后将在 C 端公开展示。`,
          okText: '发布',
          cancelText: '取消',
          onOk: async () => {
            try {
              await publishAdminTemplateService(id);
              message.success('模板已发布');
              refresh();
            } catch {
              // 错误提示由 ajax 拦截器统一处理
            }
          },
        });
        return;
      }

      // ── 下线模板（published → draft） ──
      if (typedAction === 'unpublish') {
        Modal.confirm({
          title: '确认下线该模板？',
          content: `模板「${row.title}」下线后 C 端将不再展示。`,
          okText: '下线',
          okButtonProps: { danger: true },
          cancelText: '取消',
          onOk: async () => {
            try {
              await unpublishAdminTemplateService(id);
              message.success('模板已下线');
              refresh();
            } catch {
              // 错误提示由 ajax 拦截器统一处理
            }
          },
        });
        return;
      }

      // ── 删除模板 ──
      if (typedAction === 'delete') {
        Modal.confirm({
          title: '确认删除该模板？',
          content: `模板「${row.title}」删除后不可恢复，请谨慎操作。`,
          okText: '删除',
          okButtonProps: { danger: true },
          cancelText: '取消',
          onOk: async () => {
            try {
              await deleteAdminTemplateService(id);
              message.success('模板已删除');
              refresh();
            } catch {
              // 错误提示由 ajax 拦截器统一处理
            }
          },
        });
      }
    },
    [openPreview, refresh, templateById]
  );

  // ── 表格列定义 ───────────────────────────────────────
  const columns = useMemo<ColumnsType<AdminTemplateListItem>>(() => {
    return [
      {
        title: '序号',
        key: 'index',
        width: 70,
        align: 'center',
        // 序号 = (当前页 - 1) * 每页条数 + 行索引 + 1
        render: (_value, _row, index) => (
          <span>{(page - 1) * pageSize + index + 1}</span>
        ),
      },
      {
        title: '模板标题',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
      },
      {
        title: '模板描述',
        dataIndex: 'templateDesc',
        key: 'templateDesc',
        ellipsis: true,
        render: (text: string | undefined) => text || '-',
      },
      {
        title: '状态',
        key: 'templateStatus',
        width: 100,
        render: (_, row) => {
          const color = templateStatusColorMap[row.templateStatus];
          const text = templateStatusTextMap[row.templateStatus];
          return <Tag color={color}>{text}</Tag>;
        },
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (text: string) => formatDateTime(text),
      },
      {
        title: '操作',
        key: 'actions',
        width: 280,
        render: (_, row) => (
          <Space size={4} wrap>
            {/* 编辑按钮：跳转到编辑器 */}
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              data-action="edit"
              data-id={row.id}
              onClick={handleActionClick}
            >
              编辑
            </Button>

            {/* 预览按钮 */}
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              data-action="preview"
              data-id={row.id}
              onClick={handleActionClick}
            >
              预览
            </Button>

            {/* 发布/下线按钮：根据当前状态切换 */}
            {row.templateStatus === 'draft' ? (
              <Button
                type="link"
                size="small"
                icon={<SendOutlined />}
                data-action="publish"
                data-id={row.id}
                onClick={handleActionClick}
              >
                发布
              </Button>
            ) : (
              <Button
                type="link"
                size="small"
                danger
                icon={<StopOutlined />}
                data-action="unpublish"
                data-id={row.id}
                onClick={handleActionClick}
              >
                下线
              </Button>
            )}

            {/* 删除按钮 */}
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              data-action="delete"
              data-id={row.id}
              onClick={handleActionClick}
            >
              删除
            </Button>
          </Space>
        ),
      },
    ];
  }, [page, pageSize, handleActionClick]);

  // ── 渲染 ─────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* ── 页面标题 ── */}
      <Card style={{ marginBottom: 16 }}>
        <Title level={3} className={styles.headerTitle}>
          {headerTitle}
        </Title>
      </Card>

      {/* ── 查询表单 ── */}
      <Card style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          className={styles.queryForm}
          initialValues={defaultQueryState}
        >
          <Row gutter={[16, 12]} style={{ width: '100%' }}>
            {/* 关键词输入框 */}
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="keyword" label="关键词">
                <Input
                  placeholder="模板标题 / 描述"
                  allowClear
                  className={styles.field}
                  onPressEnter={handlePressEnterQuery}
                />
              </Form.Item>
            </Col>

            {/* 模板状态下拉选择 */}
            <Col xs={24} sm={12} md={8}>
              <Form.Item name="templateStatus" label="状态">
                <Select
                  placeholder="全部状态"
                  allowClear
                  className={styles.field}
                >
                  <Select.Option value="draft">草稿</Select.Option>
                  <Select.Option value="published">已发布</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            {/* 查询 / 重置 按钮 */}
            <Col xs={24} sm={24} md={8} className={styles.actionCol}>
              <Space>
                <Button type="primary" onClick={handleQueryClick}>
                  查询
                </Button>
                <Button onClick={onReset}>重置</Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* ── 模板列表表格 ── */}
      <Card>
        <Table<AdminTemplateListItem>
          rowKey="id"
          columns={columns}
          dataSource={tableDataSource}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
            },
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Drawer
        title="模板预览"
        open={previewOpen}
        width={720}
        onClose={closePreview}
        destroyOnClose
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
                该模板暂无可预览的组件
              </Typography.Text>
            ) : null}
          </div>
        </Card>
      </Drawer>
    </div>
  );
};

export default AdminTemplates;
