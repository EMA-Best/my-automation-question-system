import { FC, MouseEvent } from 'react';
import styles from './index.module.scss';
import { Spin } from 'antd';
import useGetComponentInfo from '../../../../hooks/useGetComponentInfo';
import type { ComponentInfoType } from '../../../../store/componentsReducer';
import { changeSelectedId } from '../../../../store/componentsReducer';
import { getComponentConfigByType } from '../../../../components/QuestionComponents';
import classNames from 'classnames';
import { useDispatch } from 'react-redux';

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
  return (
    <div className={styles.canvas}>
      {visibleComponentList.map((component) => {
        const { fe_id } = component;
        // 拼接class name
        const wrapperDefaultClassName = styles['component-wrapper'];
        const selectedClassName = styles.selected;
        const wrapperClassName = classNames({
          [wrapperDefaultClassName]: true,
          [selectedClassName]: fe_id === selectedId,
        });
        return (
          <div
            key={fe_id}
            className={wrapperClassName}
            onClick={(e) => handleClick(e, fe_id)}
          >
            <div className={styles.component}>{getComponent(component)}</div>
          </div>
        );
      })}
    </div>
  );
};

export default EditCanvas;
