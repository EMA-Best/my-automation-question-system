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
  // 使用本地状态管理输入框的值，避免受控组件问题
  const [inputValue, setInputValue] = useState(title);

  // 处理标题输入框的变化
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
  }

  // 处理失焦和回车，同步到 Redux
  function handleBlur() {
    const trimmedTitle = inputValue.trim();
    if (trimmedTitle) {
      dispatch(changePageTitle(trimmedTitle));
    } else {
      // 如果为空，恢复原来的标题
      setInputValue(title);
    }
    setEditState(false);
  }

  function handlePressEnter() {
    handleBlur();
  }

  // 进入编辑状态时，同步当前标题到本地状态
  function handleEdit() {
    setInputValue(title);
    setEditState(true);
  }

  // 在编辑状态下显示输入框
  if (editState) {
    return (
      <Input
        value={inputValue}
        onChange={handleChange}
        onPressEnter={handlePressEnter}
        onBlur={handleBlur}
      />
    );
  }
  // 非编辑状态下显示标题
  return (
    <Space>
      <Title>{title}</Title>
      <Button icon={<EditOutlined />} onClick={handleEdit} type="text" />
    </Space>
  );
};

export default EditTitle;
