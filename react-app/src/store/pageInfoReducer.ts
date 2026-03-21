import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AuditStatus } from '../types/audit';

export type PageInfoType = {
  title: string;
  desc?: string;
  js?: string;
  css?: string;
  isPublished?: boolean;
  auditStatus?: AuditStatus;
  auditReason?: string;
};

const INIT_STATE: PageInfoType = {
  title: '',
  desc: '',
  js: '',
  css: '',
  // isPublished: false,
};

const pageInfoSlice = createSlice({
  name: 'pageInfo',
  initialState: INIT_STATE,
  reducers: {
    resetPageInfo: (
      state: PageInfoType,
      action: PayloadAction<PageInfoType>
    ) => {
      return action.payload;
    },
    // 修改网页问卷标题
    changePageTitle: (state: PageInfoType, action: PayloadAction<string>) => {
      state.title = action.payload;
    },

    updatePageInfo: (
      state: PageInfoType,
      action: PayloadAction<Partial<PageInfoType>>
    ) => {
      Object.assign(state, action.payload);
    },
  },
});

export const { resetPageInfo, changePageTitle, updatePageInfo } =
  pageInfoSlice.actions;

export default pageInfoSlice.reducer;
