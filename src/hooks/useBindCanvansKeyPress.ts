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

// 检查光标是否在可输入元素上
function isActiveElementValid() {
  const activeElem = document.activeElement;
  if (activeElem === document.body) return true; // 光标没有在input等可输入元素上
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
}

export default useBindCanvansKeyPress;
