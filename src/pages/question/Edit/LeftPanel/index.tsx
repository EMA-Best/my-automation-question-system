import { AppstoreAddOutlined, BarsOutlined } from '@ant-design/icons';
import { FC } from 'react';
import ComponentLib from './ComponentLib';
import Layers from './Layers';
import { Tabs } from 'antd';
import styles from './index.module.scss';

const LeftPanel: FC = () => {
  const tabsItems = [
    {
      key: 'componentLib',
      label: (
        <span>
          <AppstoreAddOutlined />
          组件库
        </span>
      ),
      children: <ComponentLib />,
    },
    {
      key: 'layers',
      label: (
        <span>
          <BarsOutlined />
          图层
        </span>
      ),
      children: <Layers />,
    },
  ];

  return (
    <div className={styles.container}>
      <Tabs
        className={styles.tabs}
        defaultActiveKey="componentLib"
        items={tabsItems}
      />
    </div>
  );
};

export default LeftPanel;
