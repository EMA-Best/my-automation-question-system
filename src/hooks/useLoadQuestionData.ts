/**
 * @description 加载单条问卷数据的hook
 * @description 从后端获取问卷数据
 * @description 以load的hook命名代表从后端获取数据
 */

import { useParams } from 'react-router-dom';
import { getQuestionService } from '../services/question';
import { useRequest } from 'ahooks';
import { useDispatch } from 'react-redux';
import { resetComponents } from '../store/componentsReducer';
import { useEffect } from 'react';
import { resetPageInfo } from '../store/pageInfoReducer';

// 加载单条问卷数据的hook
const useLoadQuestionData = () => {
  // 从路由参数中获取问卷id
  const { id = '' } = useParams();
  const dispatch = useDispatch();

  // ajax加载问卷数据
  const { data, loading, error, run } = useRequest(
    async (id: string) => {
      if (!id) throw new Error('没有问卷 id');
      const data = await getQuestionService(id);
      return data;
    },
    {
      manual: true,
    }
  );
  // 根据获取的data 设置 redux store
  useEffect(() => {
    if (!data) return;
    const {
      title = '',
      desc = '',
      js = '',
      css = '',
      componentList = [],
    } = data;
    // 获取默认的selectedId
    let selectedId = '';
    // 如果组件列表不为空，默认选中第一个组件
    if (componentList.length > 0) {
      selectedId = componentList[0].fe_id;
    }
    // 把 componentList 存储到Redux store中
    dispatch(resetComponents({ componentList, selectedId }));
    // 把问卷信息存储到Redux store中
    dispatch(resetPageInfo({ title, desc, js, css }));
  }, [data]);

  // 根据id变化，判断执行ajax 加载问卷数据
  useEffect(() => {
    run(id);
  }, [id]);

  return { loading, error };
  // async function load() {
  //   const data = await getQuestionService(id);
  //   return data;
  // }
  // const { loading, data, error } = useRequest(load);
  // return { loading, data, error };
};

export default useLoadQuestionData;
