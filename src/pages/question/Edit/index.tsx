import { FC } from 'react';
import useLoadQuestionData from '../../../hooks/useLoadQuestionData';
import styles from './index.module.scss';
import EditCanvas from './EditCanvas';
import { useDispatch } from 'react-redux';
import { changeSelectedId } from '../../../store/componentsReducer';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import EditHeader from './EditHeader';
import { useTitle } from 'ahooks';
import useGetPageInfo from '../../../hooks/useGetPageInfo';
import { useParams } from 'react-router-dom';

const Edit: FC = () => {
  const { loading } = useLoadQuestionData();
  const dispatch = useDispatch();

  const { id } = useParams();
  console.log('问卷ID: ', id);

  // 点击空白区域，取消选中组件
  // 这里因为事件冒泡导致子组件点击也会触发取消选中组件
  // 所以需要去子组件内阻止事件冒泡
  const handleCancelSelectedId = () => {
    // console.log('点击空白区域，取消选中组件');
    dispatch(changeSelectedId(''));
  };

  const { title } = useGetPageInfo();

  // 设置页面标题
  useTitle(`问卷编辑-${title}`);

  return (
    <div className={styles.container}>
      <EditHeader />
      <div className={styles['content-wrapper']}>
        <div className={styles.content}>
          <div className={styles.left}>
            <LeftPanel />
          </div>
          <div className={styles.main} onClick={() => handleCancelSelectedId()}>
            <div className={styles['canvas-wrapper']}>
              {/* <div>
                <EditCanvas loading={loading} />
              </div> */}
              <EditCanvas loading={loading} />
            </div>
          </div>
          <div className={styles.right}>
            <RightPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Edit;
