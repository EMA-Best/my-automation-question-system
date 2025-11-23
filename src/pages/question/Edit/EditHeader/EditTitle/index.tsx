import { ChangeEvent, FC, useState } from 'react';
import useGetPageInfo from '../../../../../hooks/useGetPageInfo';
import { useDispatch } from 'react-redux';
import { changePageTitle } from '../../../../../store/pageInfoReducer';
import { Button, Input, Space, Typography } from 'antd';
import { EditOutlined } from '@ant-design/icons';

const { Title } = Typography;

const EditTitle: FC = () => {
  const { title } = useGetPageInfo();
  const dispatch = useDispatch();

  // 标题是否正在编辑状态
  const [editState, setEditState] = useState(false);

  // 处理标题输入框的变化 同步Redux状态
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const newTitle = e.target.value.trim();
    if (!newTitle) return;
    dispatch(changePageTitle(newTitle));
  }

  // 在编辑状态下显示输入框
  if (editState) {
    return (
      <Input
        value={title}
        onChange={handleChange}
        onPressEnter={() => setEditState(false)}
        onBlur={() => setEditState(false)}
      />
    );
  }
  // 非编辑状态下显示标题
  return (
    <Space>
      <Title>{title}</Title>
      <Button
        icon={<EditOutlined />}
        onClick={() => setEditState(true)}
        type="text"
      />
    </Space>
  );
};

export default EditTitle;
