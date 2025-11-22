export type OptionType = {
  value: string;
  text: string;
  checked?: boolean;
};

export type QuestionCheckboxPropsType = {
  title?: string;
  isVertical?: boolean;
  options?: OptionType[];

  // 用于PropComponent
  // eslint-disable-next-line no-unused-vars
  onChange?: (newProps: QuestionCheckboxPropsType) => void;
  disabled?: boolean;
};

export const QuestionCheckboxDefaultProps: QuestionCheckboxPropsType = {
  title: '多选标题',
  isVertical: false,
  options: [
    {
      value: 'item1',
      text: '选项1',
      checked: false,
    },
    {
      value: 'item2',
      text: '选项2',
      checked: false,
    },
    {
      value: 'item3',
      text: '选项3',
      checked: false,
    },
  ],
};
