/**
 * @description 输入框组件 统一导出组件及默认属性还有类型
 */

import Component from './Component';
import PropComponent from './PropComponent';
import { QuestionInputDefaultProps } from './interface';

export * from './interface';

// 输入框组件的配置
export default {
  title: '输入框',
  type: 'questionInput', // 和后端统一
  Component,
  PropComponent,
  defaultProps: QuestionInputDefaultProps,
};
