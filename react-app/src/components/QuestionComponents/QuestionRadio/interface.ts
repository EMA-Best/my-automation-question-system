export type OptionType = {
  value: string;
  text: string;
};

export type QuestionRadioPropsType = {
  title?: string;
  isVertical?: boolean;
  /**
   * 当横向排列时，如果选项内容导致换行，则自动切换为竖向排列
   * 默认开启（true）
   */
  autoVertical?: boolean;
  options?: OptionType[];
  value?: string;

  // 用于PropComponent
  // eslint-disable-next-line no-unused-vars
  onChange?: (newProps: QuestionRadioPropsType) => void;
  disabled?: boolean;
};

export const QuestionRadioDefaultProps: QuestionRadioPropsType = {
  title: '单选标题',
  isVertical: false,
  autoVertical: true,
  options: [
    { value: '', text: '选项1' },
    { value: '', text: '选项2' },
    { value: '', text: '选项3' },
  ],
};

// 统计数据属性类型
export type QuestionRadioStatPropsType = {
  stat: Array<{ name: string; count: number }>;
};
