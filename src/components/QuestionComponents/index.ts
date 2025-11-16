import { FC } from 'react';
import QuestionInputConfig, { QuestionInputPropsType } from './QuestionInput';
import QuestionTitleConfig, { QuestionTitlePropsType } from './QuestionTitle';

// 各个组件的props type
export type ComponentPropsType = QuestionInputPropsType &
  QuestionTitlePropsType;

// 组件的配置
export type ComponentConfigType = {
  title: string;
  type: string;
  Component: FC<ComponentPropsType>;
  defaultProps: ComponentPropsType;
};

// 全部的组件配置列表
const componentConfigList: ComponentConfigType[] = [
  QuestionInputConfig,
  QuestionTitleConfig,
];

// 组件分组
export const componentConfGroup = [
  {
    groupId: 'textGroup',
    groupName: '文本显示',
    components: [QuestionTitleConfig],
  },
  {
    groupId: 'inputGroup',
    groupName: '用户输入',
    components: [QuestionInputConfig],
  },
];

// 根据组件类型获取组件配置
export function getComponentConfigByType(type: string) {
  return componentConfigList.find((item) => item.type === type);
}
