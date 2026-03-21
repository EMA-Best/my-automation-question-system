export type QuestionParagraphPropsType = {
  text?: string;
  isCenter?: boolean;

  // 用于PropComponent
  // eslint-disable-next-line no-unused-vars
  onChange?: (newProps: QuestionParagraphPropsType) => void;
  disabled?: boolean;
};

export const QuestionParagraphDefaultProps: QuestionParagraphPropsType = {
  text: '一行段落',
  isCenter: false,
};
