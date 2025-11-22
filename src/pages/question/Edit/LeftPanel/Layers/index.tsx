import classNames from 'classnames';
import { Input, message } from 'antd';
import { useDispatch } from 'react-redux';
import styles from './index.module.scss';
import useGetComponentInfo from '../../../../../hooks/useGetComponentInfo';
import { useState, FC, ChangeEvent } from 'react';
import {
  changeComponentTitle,
  changeSelectedId,
} from '../../../../../store/componentsReducer';

const Layers: FC = () => {
  const { componentList, selectedId } = useGetComponentInfo();
  const dispatch = useDispatch();

  //记录当前正在修改标题的组件
  const [changingTitleId, setChangingTitleId] = useState('');

  // 点击选中组件
  function handleTitleClick(fe_id: string) {
    const currentComponent = componentList.find((item) => item.fe_id === fe_id);
    if (currentComponent && currentComponent.isHidden) {
      message.info('不能选中隐藏的组件');
      return;
    }
    if (fe_id !== selectedId) {
      // 当前组件未被选中，执行选中
      dispatch(changeSelectedId(fe_id));
      setChangingTitleId('');
      return;
    }

    // 点击修改标题id
    setChangingTitleId(fe_id);
  }

  // 修改标题
  function changeTitle(e: ChangeEvent<HTMLInputElement>) {
    const newTitle = e.target.value.trim();
    if (newTitle === '') {
      message.info('标题不能为空');
      return;
    }
    dispatch(changeComponentTitle({ fe_id: changingTitleId, newTitle }));
  }

  return (
    <>
      {componentList.map((c) => {
        const { fe_id, title, isHidden, isLocked } = c;

        // 拼接 title className
        const titleDefaultClassName = styles.title;
        const selectedClassName = styles.selected;
        const titleClassNname = classNames({
          [titleDefaultClassName]: true,
          [selectedClassName]: fe_id === selectedId,
        });

        return (
          <div key={fe_id} className={styles.wrapper}>
            <div
              className={titleClassNname}
              onClick={() => handleTitleClick(fe_id)}
            >
              {/* onPressEnter按下回车事件 onBlur失去焦点事件 */}
              {changingTitleId === fe_id ? (
                <Input
                  value={title}
                  onChange={changeTitle}
                  onPressEnter={() => setChangingTitleId('')}
                  onBlur={() => setChangingTitleId('')}
                />
              ) : (
                title
              )}
            </div>
            <div className={styles.handler}>按钮</div>
          </div>
        );
      })}
    </>
  );
};

export default Layers;
