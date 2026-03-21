import { FC, useEffect, useState } from 'react';
import { Pagination } from 'antd';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  LIST_PAGE_NUM_PARAM_KEY,
  LIST_PAGE_SIZE_PARAM_KEY,
} from '../../constant';

type propsType = {
  total: number;
};

const ListPage: FC<propsType> = (props: propsType) => {
  const { total } = props;
  const [searchParams] = useSearchParams();
  const [current, setCurrent] = useState(1);
  const [pagesize, setPagesize] = useState(10);
  // 监听 URL 参数变化，更新当前页码和每页数量
  useEffect(() => {
    const pageNum = searchParams.get(LIST_PAGE_NUM_PARAM_KEY) || '1';
    setCurrent(Number(pageNum));
    const pageSize = searchParams.get(LIST_PAGE_SIZE_PARAM_KEY) || '10';
    setPagesize(Number(pageSize));
  }, [searchParams]);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // 当页码或每页数量变化时的回调，更新 URL 参数
  const handlePageChange = (pageNum: number, pageSize: number) => {
    searchParams.set(LIST_PAGE_NUM_PARAM_KEY, pageNum.toString());
    searchParams.set(LIST_PAGE_SIZE_PARAM_KEY, pageSize.toString());
    navigate({
      pathname,
      search: searchParams.toString(), // 只改变页码和每页数量的参数，保持其他参数不变
    });
  };
  return (
    <Pagination
      current={current}
      pageSize={pagesize}
      onChange={handlePageChange}
      total={total}
      align="center"
    />
  );
};

export default ListPage;
