import type { FC, MouseEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  Row,
  Col,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useRequest, useTitle } from 'ahooks';
import {
  deleteAdminUserService,
  getAdminUserListService,
  resetAdminUserPasswordService,
  type AdminUserListItem,
  type AdminUserListRes,
  type ResetPasswordStrategy,
  updateAdminUserRoleService,
  updateAdminUserStatusService,
  type UserStatus,
  type UserRole,
} from '../../../services/admin';
import useGetUserInfo from '../../../hooks/useGetUserInfo';
import { formatDateTime } from '../../../utils/formatDateTime';
import styles from './index.module.scss';

const { Title } = Typography;

type QueryState = {
  keyword: string;
  role?: UserRole;
  status?: UserStatus;
};

const defaultQueryState: QueryState = {
  keyword: '',
};

const roleColorMap: Record<UserRole, string> = {
  user: 'default',
  admin: 'gold',
};

const roleTextMap: Record<UserRole, string> = {
  user: '普通用户',
  admin: '管理员',
};

const statusColorMap: Record<UserStatus, string> = {
  active: 'success',
  disabled: 'default',
};

const statusTextMap: Record<UserStatus, string> = {
  active: '启用',
  disabled: '已禁用',
};

const AdminUsers: FC = () => {
  useTitle('小伦问卷 - 管理后台 - 用户管理');

  const currentUser = useGetUserInfo();

  const [form] = Form.useForm<QueryState>();
  const [queryState, setQueryState] = useState<QueryState>(defaultQueryState);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [queryVersion, setQueryVersion] = useState(0);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleModalUserId, setRoleModalUserId] = useState<string>('');
  const [roleModalValue, setRoleModalValue] = useState<UserRole>('user');

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetModalUserId, setResetModalUserId] = useState<string>('');
  const [resetStrategy, setResetStrategy] =
    useState<ResetPasswordStrategy>('random');

  const fetchList = useCallback(async () => {
    const res = await getAdminUserListService({
      page,
      pageSize,
      ...queryState,
    });
    return res;
  }, [page, pageSize, queryState]);

  const { data, loading } = useRequest(fetchList, {
    refreshDeps: [page, pageSize, queryState, queryVersion],
  });

  const listData: AdminUserListRes | undefined = data;

  const tableDataSource = useMemo(() => {
    return listData?.list ?? [];
  }, [listData]);

  const userById = useMemo(() => {
    const map = new Map<string, AdminUserListItem>();
    tableDataSource.forEach((u) => {
      map.set(u.id, u);
    });
    return map;
  }, [tableDataSource]);

  const total = listData?.count ?? 0;

  const applyQuery = useCallback((next: QueryState) => {
    setPage(1);
    setQueryState(next);
  }, []);

  const onQuery = useCallback(async () => {
    try {
      const values = await form.validateFields();
      applyQuery(values);
    } catch {
      // ignore
    }
  }, [applyQuery, form]);

  const onPressEnterQuery = useCallback(() => {
    void onQuery();
  }, [onQuery]);

  const onReset = useCallback(() => {
    setPage(1);
    const next: QueryState = {
      ...defaultQueryState,
      role: undefined,
      status: undefined,
    };
    form.setFieldsValue(next);
    setQueryState(next);
  }, [form]);

  const onRefresh = useCallback(() => {
    setQueryVersion((v) => v + 1);
  }, []);

  const closeRoleModal = useCallback(() => {
    setRoleModalOpen(false);
  }, []);

  const closeResetModal = useCallback(() => {
    setResetModalOpen(false);
  }, []);

  type ActionType =
    | 'toggleStatus'
    | 'editRole'
    | 'resetPassword'
    | 'deleteUser';

  const handleActionClick = useCallback(
    (evt: MouseEvent<HTMLElement>) => {
      const { action, id } = (evt.currentTarget as HTMLElement).dataset;
      if (!action || !id) return;
      const row = userById.get(id);
      if (!row) return;

      const isSelf =
        Boolean(currentUser.username) && currentUser.username === row.username;

      const typedAction = action as ActionType;
      if (typedAction === 'toggleStatus') {
        if (isSelf) {
          message.warning('禁止禁用自己');
          return;
        }
        const nextStatus: UserStatus =
          row.status === 'active' ? 'disabled' : 'active';
        Modal.confirm({
          title:
            nextStatus === 'disabled' ? '确认禁用该用户？' : '确认启用该用户？',
          okText: nextStatus === 'disabled' ? '禁用' : '启用',
          okButtonProps:
            nextStatus === 'disabled' ? { danger: true } : undefined,
          cancelText: '取消',
          onOk: async () => {
            await updateAdminUserStatusService(id, nextStatus);
            message.success(nextStatus === 'disabled' ? '已禁用' : '已启用');
            onRefresh();
          },
        });
        return;
      }

      if (typedAction === 'editRole') {
        if (isSelf) {
          message.warning('禁止修改自己的角色');
          return;
        }
        setRoleModalUserId(id);
        setRoleModalValue(row.role);
        setRoleModalOpen(true);
        return;
      }

      if (typedAction === 'resetPassword') {
        if (isSelf) {
          message.warning('不建议重置自己的密码');
          return;
        }
        setResetModalUserId(id);
        setResetStrategy('random');
        setResetModalOpen(true);
        return;
      }

      if (typedAction === 'deleteUser') {
        if (isSelf) {
          message.warning('禁止删除自己');
          return;
        }
        Modal.confirm({
          title: '确认删除该用户？',
          content: '删除后不可恢复，请谨慎操作。',
          okText: '删除',
          okButtonProps: { danger: true },
          cancelText: '取消',
          onOk: async () => {
            await deleteAdminUserService(id);
            message.success('已删除');
            onRefresh();
          },
        });
      }
    },
    [currentUser.username, onRefresh, userById]
  );

  const confirmUpdateRole = useCallback(async () => {
    if (!roleModalUserId) return;
    await updateAdminUserRoleService(roleModalUserId, roleModalValue);
    message.success('角色已更新');
    setRoleModalOpen(false);
    onRefresh();
  }, [onRefresh, roleModalUserId, roleModalValue]);

  const confirmResetPassword = useCallback(async () => {
    if (!resetModalUserId) return;
    const res = await resetAdminUserPasswordService(
      resetModalUserId,
      resetStrategy
    );
    setResetModalOpen(false);
    if (res.newPassword) {
      Modal.info({
        title: '密码已重置',
        content: (
          <Space direction="vertical" size={8}>
            <div>
              新密码：
              <Typography.Text
                strong
                copyable={{ text: res.newPassword }}
                style={{ marginLeft: 8 }}
              >
                {res.newPassword}
              </Typography.Text>
            </div>
            <Typography.Text type="secondary">
              该密码仅在本弹窗显示一次，请及时交付给用户。用户下次登录将被强制要求修改密码。
            </Typography.Text>
          </Space>
        ),
      });
      return;
    }
    message.success(
      resetStrategy === 'default'
        ? '已重置为默认初始密码（123456），用户下次登录需修改'
        : '密码已重置'
    );
  }, [resetModalUserId, resetStrategy]);

  const columns = useMemo<ColumnsType<AdminUserListItem>>(() => {
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
        title: '用户名',
        dataIndex: 'username',
        key: 'username',
        width: 160,
      },
      {
        title: '昵称',
        dataIndex: 'nickname',
        key: 'nickname',
      },
      {
        title: '角色',
        dataIndex: 'role',
        key: 'role',
        width: 120,
        render: (role: UserRole) => {
          const color = roleColorMap[role];
          const text = roleTextMap[role];
          return <Tag color={color}>{text}</Tag>;
        },
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (status: UserStatus) => {
          const color = statusColorMap[status];
          const text = statusTextMap[status];
          return <Tag color={color}>{text}</Tag>;
        },
      },
      {
        title: '创建时间',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 180,
        render: (value: string) => formatDateTime(value),
      },
      {
        title: '最近登录',
        dataIndex: 'lastLoginAt',
        key: 'lastLoginAt',
        width: 180,
        render: (value?: string) => (value ? formatDateTime(value) : '-'),
      },
      {
        title: '操作',
        key: 'action',
        width: 280,
        render: (_, row) => {
          const statusText = row.status === 'active' ? '禁用' : '启用';
          return (
            <Space size={4} wrap>
              <Button
                type="link"
                data-action="toggleStatus"
                data-id={row.id}
                onClick={handleActionClick}
              >
                {statusText}
              </Button>
              <Button
                type="link"
                data-action="editRole"
                data-id={row.id}
                onClick={handleActionClick}
              >
                改角色
              </Button>
              <Button
                type="link"
                data-action="resetPassword"
                data-id={row.id}
                onClick={handleActionClick}
              >
                重置密码
              </Button>
              <Button
                type="link"
                danger
                data-action="deleteUser"
                data-id={row.id}
                onClick={handleActionClick}
              >
                删除
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
          用户管理
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
                  placeholder="用户名/昵称"
                  allowClear
                  className={styles.field}
                  onPressEnter={onPressEnterQuery}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8} lg={4}>
              <Form.Item name="role" label="角色">
                <Select
                  allowClear
                  placeholder="全部"
                  className={styles.field}
                  options={[
                    { label: '普通用户', value: 'user' },
                    { label: '管理员', value: 'admin' },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8} lg={4}>
              <Form.Item name="status" label="状态">
                <Select
                  allowClear
                  placeholder="全部"
                  className={styles.field}
                  options={[
                    { label: '启用', value: 'active' },
                    { label: '已禁用', value: 'disabled' },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col xs={24} className={styles.actionCol}>
              <Form.Item>
                <Space size={12} wrap>
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
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
        <Table<AdminUserListItem>
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

      <Modal
        title="修改角色"
        open={roleModalOpen}
        onCancel={closeRoleModal}
        onOk={confirmUpdateRole}
        okText="确认"
        cancelText="取消"
        okButtonProps={{ disabled: !roleModalUserId }}
        destroyOnClose
      >
        <Select
          value={roleModalValue}
          onChange={setRoleModalValue}
          style={{ width: '100%' }}
          options={[
            { label: '普通用户', value: 'user' },
            { label: '管理员', value: 'admin' },
          ]}
        />
      </Modal>

      <Modal
        title="重置密码"
        open={resetModalOpen}
        onCancel={closeResetModal}
        onOk={confirmResetPassword}
        okText="确认"
        cancelText="取消"
        okButtonProps={{ disabled: !resetModalUserId }}
        destroyOnClose
      >
        <Radio.Group
          value={resetStrategy}
          onChange={(e) => {
            setResetStrategy(e.target.value as ResetPasswordStrategy);
          }}
        >
          <Space direction="vertical">
            <Radio value="random">随机密码</Radio>
            <Radio value="default">默认初始密码(123456)</Radio>
          </Space>
        </Radio.Group>
      </Modal>
    </Space>
  );
};

export default AdminUsers;
