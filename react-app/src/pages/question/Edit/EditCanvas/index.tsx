import { FC, MouseEvent } from 'react';
import styles from './index.module.scss';
import { Spin } from 'antd';
import useGetComponentInfo from '../../../../hooks/useGetComponentInfo';
import type { ComponentInfoType } from '../../../../store/componentsReducer';
import {
  changeSelectedId,
  moveComponent,
} from '../../../../store/componentsReducer';
import { getComponentConfigByType } from '../../../../components/QuestionComponents';
import classNames from 'classnames';
import { useDispatch } from 'react-redux';
import SortableContainer from '../../../../components/DragSortable/SortableContainer';
import SortableItem from '../../../../components/DragSortable/SortableItem';

type PropsType = {
  loading: boolean;
};

function getComponent(componentInfo: ComponentInfoType) {
  const { type, props } = componentInfo;

  const componentConf = getComponentConfigByType(type);
  if (!componentConf) return null;
  const { Component } = componentConf;
  return <Component {...props} />;
}

const EditCanvas: FC<PropsType> = (props) => {
  const { loading } = props;
  const dispatch = useDispatch();
  // 从redux store中获取组件列表
  const { componentList, selectedId } = useGetComponentInfo();

  //   console.log(componentList);
  // 如果还在加载中，显示Spin组件
  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '24px' }}>
        <Spin />
      </div>
    );
  }
  // 组件点击的回调
  const handleClick = (e: MouseEvent, id: string) => {
    // 阻止事件冒泡 否则会触发父组件的点击事件（取消选中组件）
    e.stopPropagation();
    dispatch(changeSelectedId(id));
  };

  // 过滤出未隐藏的组件
  const visibleComponentList = componentList.filter(
    (component) => !component.isHidden
  );

  // SortableContainer组件的items属性，需要每个item都有id
  const componentListWithId = componentList.map((c) => {
    return { ...c, id: c.fe_id };
  });

  // 拖拽排序的回调
  function handleDragEnd(oldIndex: number, newIndex: number) {
    dispatch(moveComponent({ oldIndex, newIndex }));
  }
  return (
    <SortableContainer items={componentListWithId} onDragEnd={handleDragEnd}>
      <div className={styles.canvas}>
        {visibleComponentList.map((component) => {
          const { fe_id, isLocked } = component;
          // 拼接class name
          const wrapperDefaultClassName = styles['component-wrapper'];
          const selectedClassName = styles.selected;
          const lockedClassName = styles.locked;
          const wrapperClassName = classNames({
            [wrapperDefaultClassName]: true,
            [selectedClassName]: fe_id === selectedId,
            [lockedClassName]: isLocked,
          });

          return (
            <SortableItem key={fe_id} id={fe_id}>
              <div
                className={wrapperClassName}
                onClick={(e) => handleClick(e, fe_id)}
              >
                <div className={styles.component}>
                  {getComponent(component)}
                </div>
              </div>
            </SortableItem>
          );
        })}
      </div>
    </SortableContainer>
  );
};

export default EditCanvas;
