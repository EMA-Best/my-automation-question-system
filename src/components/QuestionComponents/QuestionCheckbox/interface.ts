export type OptionType = {
  value: string;
  text: string;
  checked?: boolean;
};

export type QuestionCheckboxPropsType = {
  title?: string;
  isVertical?: boolean;
  /**
   * 当横向排列时，如果选项内容导致换行，则自动切换为竖向排列
   * 默认开启（true）
   */
  autoVertical?: boolean;
  options?: OptionType[];

  // 用于PropComponent
  // eslint-disable-next-line no-unused-vars
  onChange?: (newProps: QuestionCheckboxPropsType) => void;
  disabled?: boolean;
};

export const QuestionCheckboxDefaultProps: QuestionCheckboxPropsType = {
  title: '多选标题',
  isVertical: false,
  autoVertical: true,
  options: [
    {
      value: '',
      text: '选项1',
      checked: false,
    },
    {
      value: '',
      text: '选项2',
      checked: false,
    },
    {
      value: '',
      text: '选项3',
      checked: false,
    },
  ],
};

// 统计数据属性类型
export type QuestionCheckboxStatPropsType = {
  stat: Array<{ name: string; count: number }>;
};
