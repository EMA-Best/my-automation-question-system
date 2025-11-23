import { ChangeEvent, FC, useState } from 'react';
import styles from './index.module.scss';
import { Typography, Space, Button, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import { EditOutlined, LeftOutlined } from '@ant-design/icons';
import EditToolbar from './EditToolbar';
import useGetPageInfo from '../../../../hooks/useGetPageInfo';
import { useDispatch } from 'react-redux';
import { changePageTitle } from '../../../../store/pageInfoReducer';

const { Title } = Typography;

// 标题的JSX
const TitleElem: FC = () => {
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

const EditHeader: FC = () => {
  const navigate = useNavigate();
  return (
    <div className={styles['header-wrapper']}>
      <div className={styles.header}>
        <div className={styles.left}>
          <Space>
            <Button
              type="link"
              onClick={() => navigate(-1)}
              icon={<LeftOutlined />}
            >
              返回
            </Button>
            <TitleElem />
          </Space>
        </div>
        <div className={styles.main}>
          <EditToolbar />
        </div>
        <div className={styles.right}>
          <Space>
            <Button>保存</Button>
            <Button type="primary">发布</Button>
          </Space>
        </div>
      </div>
    </div>
  );
};

export default EditHeader;
