import { ComponentInfoType, ComponentsStateType } from '.';

// 获取下一个选中的组件ID
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

// 插入新组件
export function insertNewComponent(
  state: ComponentsStateType,
  newComponent: ComponentInfoType
) {
  const { selectedId, componentList } = state;
  // 寻找当前选中的组件
  const index = componentList.findIndex((c) => c.fe_id === selectedId);

  if (index < 0) {
    // 未选中任何组件 直接在组件最后添加
    state.componentList.push(newComponent);
  } else {
    // 选中了组件 在选中组件后面添加
    state.componentList.splice(index + 1, 0, newComponent);
  }
  // 选中新添加的组件
  state.selectedId = newComponent.fe_id;
}
