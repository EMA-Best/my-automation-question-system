import { FC, useEffect, useState } from 'react';
import { Tabs } from 'antd';
import { FileTextOutlined, SettingOutlined } from '@ant-design/icons';
import PropComponent from './PropComponent';
import PageSetting from './PageSetting';
import useGetComponentInfo from '../../../../hooks/useGetComponentInfo';

// 枚举定义tab的key值
// eslint-disable-next-line no-unused-vars
enum TAB_KEYS {
  // eslint-disable-next-line no-unused-vars
  PROP_KEY = 'prop',
  // eslint-disable-next-line no-unused-vars
  SETTING_KEY = 'setiing',
}

const RightPanel: FC = () => {
  // 定义tab的key值
  const [activeKey, setActiveKey] = useState(TAB_KEYS.PROP_KEY);
  const { selectedId } = useGetComponentInfo();

  // 根据是否选中组件 切换tab的key值（切换成属性面板还是页面设置面板）
  useEffect(() => {
    if (selectedId) setActiveKey(TAB_KEYS.PROP_KEY);
    else setActiveKey(TAB_KEYS.SETTING_KEY);
  }, [selectedId]);

  const tabsItems = [
    {
      key: TAB_KEYS.PROP_KEY,
      label: (
        <span>
          <FileTextOutlined />
          属性
        </span>
      ),
      children: <PropComponent />,
    },
    {
      key: TAB_KEYS.SETTING_KEY,
      label: (
        <span>
          <SettingOutlined />
          页面设置
        </span>
      ),
      children: <PageSetting />,
    },
  ];
  return <Tabs items={tabsItems} activeKey={activeKey} />;
};

export default RightPanel;
