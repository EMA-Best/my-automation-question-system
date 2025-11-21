import Component from './Component';
import PropComponent from './PropComponent';
import { QuestionInfoDefaultProps } from './interface';

export * from './interface';

export default {
  title: '问题信息',
  type: 'questionInfo',
  Component,
  PropComponent,
  defaultProps: QuestionInfoDefaultProps,
};
