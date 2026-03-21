export type QuestionComponentDto = {
  fe_id: string;
  type: string;
  title: string;
  isHidden?: boolean;
  isLocked?: boolean;
  props: Record<string, unknown>;
};

// 用于 Patch 更新（以及导入时复用的数据结构）
export type QuestionDto = {
  title?: string;
  desc?: string;
  js?: string;
  css?: string;
  isPublished?: boolean;
  isStar?: boolean;
  isDeleted?: boolean;
  componentList?: QuestionComponentDto[];
};
