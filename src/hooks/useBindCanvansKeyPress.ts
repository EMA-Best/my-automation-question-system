/**
 *  @description 绑定画布的键盘事件（快捷键）
 */

import { useDispatch } from 'react-redux';
import { useKeyPress } from 'ahooks';
import {
  removeSelectedComponent,
  copySelectedComponent,
  pasteCopiedComponent,
  selectPrevComponent,
  selectNextComponent,
} from '../store/componentsReducer';
import { ActionCreators } from 'redux-undo';

// 检查光标是否在可输入元素上
function isActiveElementValid() {
  const activeElem = document.activeElement; // 获取当前活动元素（光标所在元素）

  // 没有增加dnd-kit之前 ，光标在body上时，也可以删除组件
  // if (activeElem === document.body) return true; // 光标没有在input等可输入元素上

  // 增加了 dnd-kit 之后, 需要匹配到div元素
  if (activeElem == document.body) return true; // 没选中的时候
  // 原因是dnt-kit给组件外层增加了一层div，所以需要匹配到div元素
  if (activeElem?.matches('div[role="button"]')) return true;
  return false;
}

function useBindCanvansKeyPress() {
  const dispatch = useDispatch();
  // 删除组件
  useKeyPress(['Delete', 'Backspace'], () => {
    if (!isActiveElementValid()) return; // 光标在可输入元素上时，不删除组件
    dispatch(removeSelectedComponent());
  });

  // 复制组件
  useKeyPress(['ctrl.c', 'meta.c'], () => {
    if (!isActiveElementValid()) return; // 光标在可输入元素上时，不复制组件
    dispatch(copySelectedComponent());
  });

  // 粘贴组件
  useKeyPress(['ctrl.v', 'meta.v'], () => {
    if (!isActiveElementValid()) return; // 光标在可输入元素上时，不粘贴组件
    dispatch(pasteCopiedComponent());
  });

  // 选中上一个组件
  useKeyPress(['uparrow'], () => {
    if (!isActiveElementValid()) return; // 光标在可输入元素上时，不选中上一个组件
    dispatch(selectPrevComponent());
  });

  // 选中下一个组件
  useKeyPress(['downarrow'], () => {
    if (!isActiveElementValid()) return; // 光标在可输入元素上时，不选中下一个组件
    dispatch(selectNextComponent());
  });

  // 撤销
  useKeyPress(
    ['ctrl.z', 'meta.z'],
    () => {
      if (!isActiveElementValid()) return; // 光标在可输入元素上时，不撤销操作
      dispatch(ActionCreators.undo());
    },
    {
      exactMatch: true, // 严格匹配 ctrl.z 否则ctrl.shift.z 也会触发撤销
    }
  );

  // 重做
  useKeyPress(['ctrl.shift.z', 'meta.shift.z'], () => {
    if (!isActiveElementValid()) return; // 光标在可输入元素上时，不重做操作
    dispatch(ActionCreators.redo());
  });
}

export default useBindCanvansKeyPress;
