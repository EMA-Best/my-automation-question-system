import axios from './ajax';
import type { ResDataType } from './ajax';

type SearchOption = {
  keyword: string; // 搜索关键词
  isStar: boolean; // 是否收藏
  isDeleted: boolean; // 是否删除
  pageNum: number; // 页码
  pageSize: number; // 每页数量
  //...
};

// 获取单条问卷信息
export async function getQuestionService(id: string): Promise<ResDataType> {
  const url = `/api/question/${id}`;
  const data = (await axios.get(url)) as ResDataType;
  return data;
}

// 新增问卷
export async function createQuestionService(): Promise<ResDataType> {
  const url = `/api/question`;
  const data = (await axios.post(url)) as ResDataType;
  return data;
}

// 获取（查询）问卷列表
export async function getQuestionListService(
  options: Partial<SearchOption> = {}
): Promise<ResDataType> {
  console.log('options: ', options);

  const url = '/api/question';
  const data = (await axios.get(url, { params: options })) as ResDataType;
  return data;
}

// 修改/删除单个问卷
export async function updateQuestionService(
  id: string,
  options: { [key: string]: any }
): Promise<ResDataType> {
  const url = `/api/question/${id}`;
  const data = (await axios.patch(url, options)) as ResDataType;
  return data;
}

// 复制问卷
export async function duplicateQuestionService(
  id: string
): Promise<ResDataType> {
  const url = `/api/question/duplicate/${id}`;
  const data = (await axios.post(url)) as ResDataType;
  return data;
}

// 批量删除问卷
export async function deleteQuestionService(
  ids: string[]
): Promise<ResDataType> {
  const url = `/api/question`;
  const data = (await axios.delete(url, { data: { ids } })) as ResDataType;
  return data;
}
