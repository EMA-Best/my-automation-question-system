import { useRequest } from 'ahooks';
import { FC, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getQuestionStatListService } from '../../../../services/stat';
import { Pagination, Spin, Table, Typography } from 'antd';
import useGetComponentInfo from '../../../../hooks/useGetComponentInfo';

type PropsType = {
  selectedComponentId: string;
  // eslint-disable-next-line no-unused-vars
  setSelectedComponentId: (id: string) => void;
  // eslint-disable-next-line no-unused-vars
  setSelectedComponentType: (type: string) => void;
};

const { Title } = Typography;

const PageStat: FC<PropsType> = (props) => {
  const {
    selectedComponentId,
    setSelectedComponentId,
    setSelectedComponentType,
  } = props;
  const { id = '' } = useParams();
  const [total, setTotal] = useState(0);
  const [list, setList] = useState([]);
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
        console.log('问卷统计信息：', res);

        const { total, list = [] } = res;

        setTotal(total);
        setList(list);
      },
    }
  );

  const { componentList } = useGetComponentInfo();

  console.log('componentList: ', componentList);

  // 表格需要的列配置
  const columns = componentList.map((c) => {
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
        <span
          style={{
            color: fe_id === selectedComponentId ? '#1890ff' : 'inherit',
          }}
        >
          {colTitle}
        </span>
      </div>
    );
    return {
      //title: colTitle,
      title: TitleElem,
      dataIndex: fe_id,
      key: fe_id,
    };
  });

  console.log('columns: ', columns);

  console.log('list: ', list);

  // 表格需要的数据源 默认没有key 所以需要手动添加
  const dataSource = list.map((item: any) => {
    return {
      ...item,
      key: item._id,
    };
  });

  console.log('dataSource: ', dataSource);

  // 表格元素
  const TableElem = (
    <>
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
      ></Table>
      <div style={{ marginTop: '18px' }}>
        <Pagination
          total={total}
          align="center"
          pageSize={pageSize}
          current={page}
          onChange={(page) => setPage(page)}
          onShowSizeChange={(page, pageSize) => {
            setPage(page);
            setPageSize(pageSize);
          }}
        />
      </div>
    </>
  );

  return (
    <div>
      <Title level={3}>答卷数量：{!loading && total}</Title>
      {loading && (
        <div style={{ textAlign: 'center' }}>
          <Spin />
        </div>
      )}
      {!loading && TableElem}
    </div>
  );
};

export default PageStat;
