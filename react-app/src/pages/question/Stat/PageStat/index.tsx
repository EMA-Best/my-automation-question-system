import { useRequest } from 'ahooks';
import { FC, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getQuestionStatListService } from '../../../../services/stat';
import { Empty, Pagination, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import useGetComponentInfo from '../../../../hooks/useGetComponentInfo';
import styles from './index.module.scss';

type PropsType = {
  selectedComponentId: string;
  // eslint-disable-next-line no-unused-vars
  setSelectedComponentId: (id: string) => void;
  // eslint-disable-next-line no-unused-vars
  setSelectedComponentType: (type: string) => void;
};

type StatRow = Record<string, unknown> & { _id: string };

const NON_ANSWER_COMPONENT_TYPES = new Set([
  'questionInfo',
  'questionTitle',
  'questionParagraph',
]);

function hasMeaningfulValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

const PageStat: FC<PropsType> = (props) => {
  const {
    selectedComponentId,
    setSelectedComponentId,
    setSelectedComponentType,
  } = props;
  const { id = '' } = useParams();
  const [total, setTotal] = useState(0);
  const [list, setList] = useState<StatRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 发起ajax请求获取统计数据
  const { loading } = useRequest(
    async () => {
      const res = await getQuestionStatListService(id, {
        page,
        pageSize,
      });
      return res;
    },
    {
      refreshDeps: [id, page, pageSize], // 依赖id,page,pageSize刷新
      onSuccess(res) {
        const { total, list = [] } = res;

        setTotal(total);
        setList(list);
      },
    }
  );

  const { componentList } = useGetComponentInfo();

  // 表格需要的列配置
  const columns: ColumnsType<Record<string, unknown>> = componentList
    .filter((c) => !c.isHidden)
    .filter((c) => !NON_ANSWER_COMPONENT_TYPES.has(c.type))
    .filter((c) => list.some((row) => hasMeaningfulValue(row[c.fe_id])))
    .map((c) => {
      const { fe_id, title, props = {}, type } = c;
      const colTitle = props.title || title;

      // 表格title列的元素
      const TitleElem = (
        <div
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setSelectedComponentId(fe_id);
            setSelectedComponentType(type);
          }}
        >
          <Typography.Text
            ellipsis={{ tooltip: String(colTitle ?? '') }}
            style={{
              color: fe_id === selectedComponentId ? '#1677ff' : 'inherit',
            }}
          >
            {String(colTitle ?? '')}
          </Typography.Text>
        </div>
      );

      return {
        //title: colTitle,
        title: TitleElem,
        dataIndex: fe_id,
        key: fe_id,
        width: 200,
      };
    });

  // 表格需要的数据源 默认没有key 所以需要手动添加
  const dataSource = list.map((item) => {
    return {
      ...item,
      key: item._id,
    };
  });

  const emptyText =
    total === 0 ? '暂无答卷数据' : '暂无可展示数据（请检查题目配置）';

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <div>
          <div className={styles.title}>答卷数量：{loading ? '—' : total}</div>
          <div className={styles.subTitle}>
            点击表头题目可快速定位到左侧组件
          </div>
        </div>

        <Typography.Text type="secondary">
          第 {page} 页 / 每页 {pageSize} 条
        </Typography.Text>
      </div>

      <div className={styles.tableWrap}>
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={false}
          size="middle"
          bordered
          sticky
          loading={loading}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={emptyText}
              />
            ),
          }}
          rowClassName={(_, index) => (index % 2 === 1 ? styles.rowOdd : '')}
          scroll={{ x: 'max-content' }}
        />

        <div className={styles.paginationWrap}>
          <Pagination
            total={total}
            align="center"
            pageSize={pageSize}
            current={page}
            showSizeChanger
            showQuickJumper
            onChange={(nextPage) => setPage(nextPage)}
            onShowSizeChange={(nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PageStat;
