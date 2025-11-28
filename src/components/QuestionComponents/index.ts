import { FC } from 'react';
import QuestionInputConfig, { QuestionInputPropsType } from './QuestionInput';
import QuestionTitleConfig, { QuestionTitlePropsType } from './QuestionTitle';
import QuestionParagraphConfig, {
  QuestionParagraphPropsType,
} from './QuestionParagraph';
import QuestionInfoConfig, { QuestionInfoPropsType } from './QuestionInfo';
import QuestionTextareaConfig, {
  QustionTextareaPropsType,
} from './QuestionTextarea';
import QuestionRadioConfig, {
  QuestionRadioPropsType,
  QuestionRadioStatPropsType,
} from './QuestionRadio';
import QuestionCheckboxConfig, {
  QuestionCheckboxPropsType,
  QuestionCheckboxStatPropsType,
} from './QuestionCheckbox';

// 各个组件的props type
export type ComponentPropsType = QuestionInputPropsType &
  QuestionTitlePropsType &
  QuestionParagraphPropsType &
  QuestionInfoPropsType &
  QustionTextareaPropsType &
  QuestionRadioPropsType &
  QuestionCheckboxPropsType;

// 各个组件的统计属性类型
type ComponentStatPropsType = QuestionRadioStatPropsType &
  QuestionCheckboxStatPropsType;

// 组件的配置
export type ComponentConfigType = {
  title: string;
  type: string;
  Component: FC<ComponentPropsType>;
  PropComponent: FC<ComponentPropsType>;
  defaultProps: ComponentPropsType;
  StatComponent?: FC<ComponentStatPropsType>;
};

// 全部的组件配置列表
const componentConfigList: ComponentConfigType[] = [
  QuestionInputConfig,
  QuestionTitleConfig,
  QuestionParagraphConfig,
  QuestionInfoConfig,
  QuestionTextareaConfig,
  QuestionRadioConfig,
  QuestionCheckboxConfig,
];

// 组件分组
export const componentConfGroup = [
  {
    groupId: 'textGroup',
    groupName: '文本显示',
    components: [
      QuestionInfoConfig,
      QuestionTitleConfig,
      QuestionParagraphConfig,
    ],
  },
  {
    groupId: 'inputGroup',
    groupName: '用户输入',
    components: [QuestionInputConfig, QuestionTextareaConfig],
  },
  {
    groupId: 'chooseGroup',
    groupName: '用户选择',
    components: [QuestionRadioConfig, QuestionCheckboxConfig],
  },
];

// 根据组件类型获取组件配置
export function getComponentConfigByType(type: string) {
  return componentConfigList.find((item) => item.type === type);
}
