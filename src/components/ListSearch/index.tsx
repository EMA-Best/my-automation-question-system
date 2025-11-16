import { FC, ChangeEvent, useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from 'antd';
import { LIST_SEARCH_PARAM_KEY } from '../../constant';

const { Search } = Input;

const ListSearch: FC = () => {
  // 定义搜索框的值
  const [value, setValue] = useState('');
  // 编程式导航
  const navigate = useNavigate();
  // 获取当前路径
  const { pathname } = useLocation();
  // 点击搜索按钮时触发
  const onSearch = (value: string) => {
    // console.log(pathname);
    // console.log(value);
    // 跳转到搜索结果页面 (只改变url搜索参数)
    navigate({
      pathname,
      search: `${LIST_SEARCH_PARAM_KEY}=${value}`, // 只携带搜索关键词参数，没有其他参数
    });
  };
  // 获取url搜索参数
  const [searchParams] = useSearchParams();
  // 监听页面searchParams变化
  useEffect(() => {
    // 初始化时，根据url搜索参数设置搜索框的值
    const keyword = searchParams.get(LIST_SEARCH_PARAM_KEY);
    if (keyword) {
      setValue(keyword);
    }
  }, [searchParams]);

  // 输入框值改变时触发
  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };
  return (
    <div>
      <Search
        size="large"
        placeholder="请输入要搜索的内容"
        allowClear
        onSearch={onSearch}
        onChange={onChange}
        value={value}
        style={{ width: 300 }}
      />
    </div>
  );
};

export default ListSearch;
