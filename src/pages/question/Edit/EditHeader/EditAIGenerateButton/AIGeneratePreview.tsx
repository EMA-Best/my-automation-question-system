import { FC, useMemo } from 'react';
import { Empty } from 'antd';
import type { PageInfoType } from '../../../../../store/pageInfoReducer';
import type { ComponentInfoType } from '../../../../../store/componentsReducer';
import { getComponentConfigByType } from '../../../../../components/QuestionComponents';
import styles from './AIGeneratePreview.module.scss';

type Props = {
  pageInfo: PageInfoType;
  componentList: ComponentInfoType[];
};

function renderComponent(componentInfo: ComponentInfoType) {
  const componentConf = getComponentConfigByType(componentInfo.type);
  if (!componentConf) return null;
  const { Component } = componentConf;
  return <Component {...componentInfo.props} />;
}

const AIGeneratePreview: FC<Props> = ({ pageInfo, componentList }) => {
  const visibleList = useMemo(
    () => componentList.filter((c) => !c.isHidden),
    [componentList]
  );

  // pageInfo 在 AIGenerateModal 中会被转成一个“问卷信息组件”置顶
  // 这里预览只渲染 componentList，确保与画布展示一致
  void pageInfo;

  if (visibleList.length === 0) {
    return <Empty description="生成过程中将实时预览" />;
  }

  return (
    <div className={styles.componentList}>
      {visibleList.map((c) => (
        <div key={c.fe_id} className={styles.componentItem}>
          {renderComponent(c)}
        </div>
      ))}
    </div>
  );
};

export default AIGeneratePreview;
