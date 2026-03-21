/** 模板列表卡片（公开接口返回，无 componentList 全量数据） */
export type TemplateListItem = {
  id: string;
  title: string;
  templateDesc?: string;
  cover?: string;
  componentSummary?: Array<{ type: string; count: number }>;
  category?: string;
  tags?: string[];
  createdAt: string;
};

/** 模板详情（含完整 componentList，用于预览/使用） */
export type TemplateDetail = {
  id: string;
  title: string;
  templateDesc?: string;
  desc: string;
  js: string;
  css: string;
  componentList: Array<{
    fe_id: string;
    type: string;
    title: string;
    props: Record<string, unknown>;
    isHidden?: boolean;
    isLocked?: boolean;
  }>;
};

/** "使用模板"成功响应 */
export type UseTemplateRes = {
  questionId: string;
};

/** 模板列表接口响应 */
export type TemplateListRes = {
  list: TemplateListItem[];
  count: number;
  page: number;
  pageSize: number;
};

/** 模板列表查询参数 */
export type TemplateListQuery = {
  page?: number;
  pageSize?: number;
  keyword?: string;
  category?: string;
  tag?: string;
};
