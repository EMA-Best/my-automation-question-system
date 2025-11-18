import {
  BlockOutlined,
  CopyOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { Button, Space, Tooltip } from 'antd';
import { FC } from 'react';
import { useDispatch } from 'react-redux';
import {
  removeSelectedComponent,
  changeComponentHidden,
  toggleComponentLocked,
  copySelectedComponent,
  pasteCopiedComponent,
} from '../../../../../store/componentsReducer';
import useGetComponentInfo from '../../../../../hooks/useGetComponentInfo';

const EditToolbar: FC = () => {
  const dispatch = useDispatch();

  // 获取选中的组件id
  const { selectedId, selectedComponent, copiedComponent } =
    useGetComponentInfo();

  // 获取当前选中组件的锁定状态
  const { isLocked } = selectedComponent || {};

  // 删除选中的组件
  const handleDelete = () => {
    dispatch(removeSelectedComponent());
  };

  // 隐藏选中的组件
  const handleHidden = () => {
    dispatch(changeComponentHidden({ fe_id: selectedId, isHidden: true }));
  };

  // 锁定 / 解锁选中的组件
  const handleLock = () => {
    dispatch(toggleComponentLocked({ fe_id: selectedId }));
  };

  // 复制 选中的组件
  const handleCopy = () => {
    dispatch(copySelectedComponent());
  };

  // 粘贴 选中的组件
  const handlePaste = () => {
    dispatch(pasteCopiedComponent());
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
          icon={<EyeInvisibleOutlined />}
          onClick={handleHidden}
        ></Button>
      </Tooltip>
      <Tooltip title="锁定">
        <Button
          shape="circle"
          icon={<LockOutlined />}
          onClick={handleLock}
          type={isLocked ? 'primary' : 'default'}
        ></Button>
      </Tooltip>
      <Tooltip title="复制">
        <Button
          shape="circle"
          icon={<CopyOutlined />}
          onClick={handleCopy}
        ></Button>
      </Tooltip>
      <Tooltip title="粘贴">
        <Button
          shape="circle"
          icon={<BlockOutlined />}
          onClick={handlePaste}
          disabled={copiedComponent == null}
        ></Button>
      </Tooltip>
    </Space>
  );
};

export default EditToolbar;
