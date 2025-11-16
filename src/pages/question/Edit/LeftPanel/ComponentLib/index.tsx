import { Dispatch, FC } from 'react';
import { componentConfGroup } from '../../../../../components/QuestionComponents';
import type { ComponentConfigType } from '../../../../../components/QuestionComponents';
import { Typography } from 'antd';
import styles from './index.module.scss';
import { useDispatch } from 'react-redux';
import { addComponent } from '../../../../../store/componentsReducer';
import { nanoid } from 'nanoid';

const { Title } = Typography;

const getComponent = (
  component: ComponentConfigType,
  dispatch: Dispatch<any>
) => {
  const { title, type, Component, defaultProps } = component;

  const handleClick = () => {
    dispatch(
      addComponent({
        fe_id: nanoid(),
        title,
        type,
        props: defaultProps,
      })
    );
  };

  return (
    <div className={styles.wrapper} onClick={() => handleClick()} key={type}>
      <div className={styles.component}>
        <Component />
      </div>
    </div>
  );
};

const ComponentLib: FC = () => {
  const dispatch = useDispatch();
  return (
    <>
      {componentConfGroup.map((group, index) => {
        const { groupId, groupName, components } = group;
        return (
          <div key={groupId}>
            <Title
              level={3}
              style={{ fontSize: '16px', marginTop: index > 0 ? '12px' : '0' }}
            >
              {groupName}
            </Title>
            <div>
              {components.map((component) => getComponent(component, dispatch))}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default ComponentLib;
