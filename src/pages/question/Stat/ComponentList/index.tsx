import { FC } from 'react';
import classNames from 'classnames';
import styles from './index.module.scss';
import useGetComponentInfo from '../../../../hooks/useGetComponentInfo';
import { getComponentConfigByType } from '../../../../components/QuestionComponents';

type PropsType = {
  selectedComponentId: string;
  // eslint-disable-next-line no-unused-vars
  setSelectedComponentId: (id: string) => void;
  // eslint-disable-next-line no-unused-vars
  setSelectedComponentType: (type: string) => void;
};

const ComponentList: FC<PropsType> = ({
  selectedComponentId,
  setSelectedComponentId,
  setSelectedComponentType,
}) => {
  const { componentList } = useGetComponentInfo();

  return (
    <div className={styles.container}>
      {componentList
        .filter((c) => !c.isHidden)
        .map((c) => {
          const { fe_id, props, type } = c;
          const componentConf = getComponentConfigByType(type);
          if (componentConf == null) return null;
          const { Component } = componentConf;

          //拼接class name
          const wrapperDefaultClassName = styles['component-wrapper'];
          const selectedClassName = styles.selected;
          const wrapperClassName = classNames({
            [wrapperDefaultClassName]: true,
            [selectedClassName]: fe_id === selectedComponentId, // 是否选中
          });

          return (
            <div
              className={wrapperClassName}
              key={fe_id}
              onClick={() => {
                setSelectedComponentId(fe_id);
                setSelectedComponentType(type);
              }}
            >
              <div className={styles.component}>
                <Component {...props} />
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default ComponentList;
