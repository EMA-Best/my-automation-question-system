/**
 * @file 加载管理员模板列表数据的 Hook
 * @description 对应文档 §4.1.1（页面与路由），遵循项目命名约定：
 *   - useLoad* = 从后端加载数据
 *   - 内部使用 ahooks/useRequest
 *   - 从 URL searchParams 读取分页/搜索参数
 *
 * 使用场景：
 *   在需要管理员模板列表数据的页面中调用，自动根据 URL 参数刷新数据。
 *
 * 示例：
 *   const { data, loading, error, refresh } = useLoadAdminTemplateListData();
 */

import { useSearchParams } from 'react-router-dom';
import { useRequest } from 'ahooks';
import { getAdminTemplateListService } from '../services/template';
import type { AdminTemplateListRes } from '../types/template';
import type { TemplateStatus } from '../types/template';
import {
  LIST_SEARCH_PARAM_KEY,
  LIST_PAGE_NUM_PARAM_KEY,
  LIST_PAGE_SIZE_PARAM_KEY,
} from '../constant/index';

/**
 * Hook 配置项
 */
type Options = {
  /** 模板发布状态筛选 */
  templateStatus?: TemplateStatus;
};

/**
 * 加载管理员模板列表数据
 *
 * 自动从 URL searchParams 中读取：
 *  - keyword：搜索关键词
 *  - pageNum：页码
 *  - pageSize：每页条数
 *
 * 当 searchParams 变化时自动重新请求（refreshDeps）。
 *
 * @param options - 可选的额外筛选参数
 * @returns { data, loading, error, refresh } 与 ahooks/useRequest 返回值一致
 */
const useLoadAdminTemplateListData = (options: Partial<Options> = {}) => {
  // 从 URL 读取搜索参数
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get(LIST_SEARCH_PARAM_KEY) || '';
  const pageNum = Number(searchParams.get(LIST_PAGE_NUM_PARAM_KEY) || '1');
  const pageSize = Number(searchParams.get(LIST_PAGE_SIZE_PARAM_KEY) || '10');

  const { templateStatus } = options;

  /**
   * 实际的请求函数
   * 封装参数并调用 service 层
   */
  const fetchTemplateList = async (): Promise<AdminTemplateListRes> => {
    const data = await getAdminTemplateListService({
      page: pageNum,
      pageSize,
      keyword: keyword || undefined,
      templateStatus,
    });
    return data;
  };

  // 使用 ahooks/useRequest，searchParams 变化时自动刷新
  const { data, loading, error, refresh } = useRequest(fetchTemplateList, {
    refreshDeps: [searchParams],
  });

  return { data, loading, error, refresh };
};

export default useLoadAdminTemplateListData;
