/**
 * @description 标题组件 统一导出组件及默认属性还有类型
 */

import Component from './Component';
import { QuestionTitleDefaultProps } from './interface';

export * from './interface';

// 标题组件的配置
export default {
  title: '标题',
  type: 'questionTitle', // 和后端统一
  Component,
  defaultProps: QuestionTitleDefaultProps,
};
