export type QuestionInputPropsType = {
  title?: string;
  placeholder?: string;
  // eslint-disable-next-line no-unused-vars
  onChange?: (newProps: QuestionInputPropsType) => void;
};

export const QuestionInputDefaultProps: QuestionInputPropsType = {
  title: '输入框标题',
  placeholder: '请输入...',
};
