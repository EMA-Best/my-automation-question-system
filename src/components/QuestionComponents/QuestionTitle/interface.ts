// 问卷标题组件的属性类型
export type QuestionTitlePropsType = {
  text?: string;
  level?: 1 | 2 | 3 | 4 | 5;
  isCenter?: boolean;
  // eslint-disable-next-line no-unused-vars
  onChange?: (newProps: QuestionTitlePropsType) => void; // 标题属性变化时的回调函数
};

// 问卷标题组件的默认属性值
export const QuestionTitleDefaultProps: QuestionTitlePropsType = {
  text: '一行标题',
  level: 1,
  isCenter: false,
};
