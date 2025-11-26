import {
  BlockOutlined,
  CopyOutlined,
  DeleteOutlined,
  DownOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  UpOutlined,
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
  moveComponent,
} from '../../../../../store/componentsReducer';
import useGetComponentInfo from '../../../../../hooks/useGetComponentInfo';
import useBindCanvansKeyPress from '../../../../../hooks/useBindCanvansKeyPress';

const EditToolbar: FC = () => {
  const dispatch = useDispatch();
  // 绑定画布键盘(快捷键)事件
  useBindCanvansKeyPress();

  // 获取选中的组件id
  const { selectedId, selectedComponent, copiedComponent, componentList } =
    useGetComponentInfo();

  // 获取当前选中组件的锁定状态
  const { isLocked } = selectedComponent || {};

  // 获取组件列表长度
  const length = componentList.length;
  // 获取选中组件的索引
  const selectedIndex = componentList.findIndex((c) => c.fe_id === selectedId);
  const isFirst = selectedIndex <= 0; // 判断是否到第一个组件
  const isLast = selectedIndex + 1 >= length; // 判断是否到最后一个组件

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

  // todo 上移/下移 撤销/重做

  // 上移组件
  const moveUp = () => {
    // 如果是第一个组件，不能上移
    if (isFirst) return;
    dispatch(
      moveComponent({ oldIndex: selectedIndex, newIndex: selectedIndex - 1 })
    );
  };

  // 下移组件
  // 上移组件
  const moveDown = () => {
    // 如果是最后一个组件，不能下移
    if (isLast) return;
    dispatch(
      moveComponent({ oldIndex: selectedIndex, newIndex: selectedIndex + 1 })
    );
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
      <Tooltip title="上移">
        <Button
          shape="circle"
          icon={<UpOutlined />}
          onClick={moveUp}
          disabled={isFirst}
        ></Button>
      </Tooltip>
      <Tooltip title="下移">
        <Button
          shape="circle"
          icon={<DownOutlined />}
          onClick={moveDown}
          disabled={isLast}
        ></Button>
      </Tooltip>
    </Space>
  );
};

export default EditToolbar;
