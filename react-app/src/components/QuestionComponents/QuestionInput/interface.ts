export type QuestionInputPropsType = {
  title?: string;
  placeholder?: string;
  // eslint-disable-next-line no-unused-vars
  onChange?: (newProps: QuestionInputPropsType) => void; // 输入框属性变化时的回调函数
  disabled?: boolean; // 是否禁用输入框编辑
};

export const QuestionInputDefaultProps: QuestionInputPropsType = {
  title: '输入框标题',
  placeholder: '请输入...',
};
