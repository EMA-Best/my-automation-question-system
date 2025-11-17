import { ComponentInfoType } from '.';

export function getNextSelectedId(
  componentList: ComponentInfoType[],
  fe_id: string
) {
  // 过滤出可见的组件
  const visibleComponentList = componentList.filter((c) => !c.isHidden);
  // 寻找当前选中的组件
  const index = visibleComponentList.findIndex((c) => c.fe_id === fe_id);
  let newSelectedId = '';
  // 获取组件数组长度
  const length = visibleComponentList.length;
  if (length <= 1) {
    // 只有一个组件，删除后没有可选中的组件
    newSelectedId = '';
  } else {
    // 有多个组件
    if (index + 1 === length) {
      // 要删除的是最后一个组件 删除后需要选中上一个组件
      newSelectedId = visibleComponentList[index - 1].fe_id;
    } else {
      // 要删除的不是最后一个组件 删除以后要选中下一个组件
      newSelectedId = visibleComponentList[index + 1].fe_id;
    }
  }
  return newSelectedId;
}
