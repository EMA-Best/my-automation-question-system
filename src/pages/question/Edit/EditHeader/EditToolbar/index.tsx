import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, Space, Tooltip } from 'antd';
import { FC } from 'react';
import { useDispatch } from 'react-redux';
import {
  removeSelectedComponent,
  changeComponentHidden,
} from '../../../../../store/componentsReducer';
import useGetComponentInfo from '../../../../../hooks/useGetComponentInfo';

const EditToolbar: FC = () => {
  const dispatch = useDispatch();

  // 获取选中的组件id
  const { selectedId } = useGetComponentInfo();

  // 删除选中的组件
  const handleDelete = () => {
    dispatch(removeSelectedComponent());
  };

  // 隐藏选中的组件
  const handleHidden = () => {
    dispatch(changeComponentHidden({ fe_id: selectedId, isHidden: true }));
  };

  return (
    <Space>
      <Tooltip title="删除">
        <Button
          shape="circle"
          icon={<DeleteOutlined />}
          onClick={handleDelete}
        ></Button>
      </Tooltip>
      <Tooltip title="隐藏">
        <Button
          shape="circle"
          icon={<EyeOutlined />}
          onClick={handleHidden}
        ></Button>
      </Tooltip>
    </Space>
  );
};

export default EditToolbar;
