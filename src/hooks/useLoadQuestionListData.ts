/**
 * @description 加载问卷列表数据的hook
 * @description 从后端获取问卷列表数据
 * @description 以load的hook命名代表从后端获取数据
 */

import { useSearchParams } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { getQuestionListService } from '../services/question';
import {
  LIST_SEARCH_PARAM_KEY,
  LIST_PAGE_NUM_PARAM_KEY,
  LIST_PAGE_SIZE_PARAM_KEY,
} from '../constant/index';

// 定义问卷列表查询参数的类型
type SearchOption = {
  isStar: boolean;
  isDeleted: boolean;
  pageNum: number;
  pageSize: number;
  //...
};
// 加载问卷列表的hook
const useLoadQuestionListData = (options: Partial<SearchOption> = {}) => {
  // 获取查询参数
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get(LIST_SEARCH_PARAM_KEY) || '';
  const pageNum = Number(searchParams.get(LIST_PAGE_NUM_PARAM_KEY) || '1');
  const pageSize = Number(searchParams.get(LIST_PAGE_SIZE_PARAM_KEY) || '10');

  const { isStar, isDeleted } = options;
  console.log('typeof isStar: ', typeof isStar);

  // 定义useRequestion函数的第一个函数参数
  const getQuestionListServiceParams = async () => {
    const data = await getQuestionListService({
      keyword,
      isStar,
      isDeleted,
      pageNum,
      pageSize,
    });
    return data;
  };
  const { data, loading, error, refresh } = useRequest(
    getQuestionListServiceParams,
    {
      refreshDeps: [searchParams], // 刷新的依赖项
    }
  );

  return { data, loading, error, refresh };
};

export default useLoadQuestionListData;
