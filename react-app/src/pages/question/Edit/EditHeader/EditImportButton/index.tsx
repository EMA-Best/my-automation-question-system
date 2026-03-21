import { Button, Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import { FC } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useRequest } from 'ahooks';
import { nanoid } from 'nanoid';
import { ActionCreators } from 'redux-undo';
import * as XLSX from 'xlsx';
import { resetComponents } from '../../../../../store/componentsReducer';
import {
  resetPageInfo,
  PageInfoType,
} from '../../../../../store/pageInfoReducer';
import type { ComponentInfoType } from '../../../../../store/componentsReducer';
import { importIntoQuestionService } from '../../../../../services/question';

type ImportedDataType =
  | {
      // 兼容后端 getQuestionService 返回结构
      title?: string;
      desc?: string;
      author?: string;
      js?: string;
      css?: string;
      isPublished?: boolean;
      isStar?: boolean;
      isDeleted?: boolean;
      componentList?: ComponentInfoType[];
    }
  | {
      // 兼容自定义导出结构
      pageInfo?: PageInfoType;
      componentList?: ComponentInfoType[];
    };

function coerceBoolean(value: unknown, defaultValue: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'true') return true;
    if (v === 'false') return false;
    if (v === '1') return true;
    if (v === '0') return false;
  }
  return defaultValue;
}

function safeJsonParseObject(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value != null) {
    return value as Record<string, unknown>;
  }
  if (typeof value === 'string') {
    const str = value.trim();
    if (!str) return {};
    try {
      const parsed = JSON.parse(str) as unknown;
      if (typeof parsed === 'object' && parsed != null) {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch {
      return {};
    }
  }
  return {};
}

function normalizeImportedExcelData(raw: ArrayBuffer): {
  pageInfo: PageInfoType;
  componentList: ComponentInfoType[];
  payload: ImportedDataType;
} | null {
  const workbook = XLSX.read(raw, { type: 'array' });

  // 兼容：我们现在导出的是 question + componentList
  // 也兼容老的 pageInfo + componentList（如果用户手工改了 sheet 名）
  const questionSheetName =
    workbook.SheetNames.find((n) => n === 'question') ??
    workbook.SheetNames.find((n) => n === 'pageInfo');
  const componentSheetName = workbook.SheetNames.find(
    (n) => n === 'componentList'
  );

  if (!questionSheetName || !componentSheetName) return null;

  const questionSheet = workbook.Sheets[questionSheetName];
  const componentSheet = workbook.Sheets[componentSheetName];
  if (!questionSheet || !componentSheet) return null;

  const questionRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    questionSheet,
    {
      defval: '',
    }
  );
  const questionRow = questionRows[0] ?? {};

  const componentRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    componentSheet,
    {
      defval: '',
    }
  );

  const componentList = sanitizeComponentList(
    componentRows.map((row) => {
      return {
        fe_id: row.fe_id,
        type: row.type,
        title: row.title,
        isHidden: coerceBoolean(row.isHidden, false),
        isLocked: coerceBoolean(row.isLocked, false),
        props: safeJsonParseObject(row.props),
      };
    })
  );

  if (!componentList) return null;

  // pageInfoReducer 只关心编辑相关字段
  const pageInfo: PageInfoType = {
    title: (questionRow.title as string) ?? '',
    desc: (questionRow.desc as string) ?? '',
    js: (questionRow.js as string) ?? '',
    css: (questionRow.css as string) ?? '',
    isPublished: coerceBoolean(questionRow.isPublished, false),
  };

  // 给后端的 payload：对齐后端导入兼容结构（扁平结构 + componentList）
  const payload: ImportedDataType = {
    title: pageInfo.title,
    desc: pageInfo.desc,
    author: (questionRow.author as string) ?? '',
    js: pageInfo.js,
    css: pageInfo.css,
    isPublished: pageInfo.isPublished,
    isStar: coerceBoolean(questionRow.isStar, false),
    isDeleted: coerceBoolean(questionRow.isDeleted, false),
    componentList,
  };

  return { pageInfo, componentList, payload };
}

function sanitizeComponentList(input: unknown): ComponentInfoType[] | null {
  if (!Array.isArray(input)) return null;

  const usedIds = new Set<string>();

  const list: ComponentInfoType[] = input
    .map((raw) => {
      if (typeof raw !== 'object' || raw == null) return null;
      const record = raw as Record<string, unknown>;

      const type = typeof record.type === 'string' ? record.type : '';
      const title = typeof record.title === 'string' ? record.title : '';
      const props =
        typeof record.props === 'object' && record.props != null
          ? (record.props as Record<string, unknown>)
          : {};

      // 修复/去重 fe_id
      let fe_id = typeof record.fe_id === 'string' ? record.fe_id : '';
      if (!fe_id || usedIds.has(fe_id)) fe_id = nanoid();
      usedIds.add(fe_id);

      const isHidden =
        typeof record.isHidden === 'boolean' ? record.isHidden : undefined;
      const isLocked =
        typeof record.isLocked === 'boolean' ? record.isLocked : undefined;

      if (!type) return null;

      const comp: ComponentInfoType = {
        fe_id,
        type,
        title: title || type,
        props: props as unknown as ComponentInfoType['props'],
        ...(isHidden != null ? { isHidden } : {}),
        ...(isLocked != null ? { isLocked } : {}),
      };

      return comp;
    })
    .filter(Boolean) as ComponentInfoType[];

  return list;
}

const EditImportButton: FC = () => {
  const dispatch = useDispatch();
  const { id } = useParams();

  const { loading: saving, runAsync: saveToServer } = useRequest(
    async (data: { id: string; payload: unknown }) => {
      const { id, payload } = data;
      await importIntoQuestionService(id, payload);
    },
    { manual: true }
  );

  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    try {
      const buffer = await file.arrayBuffer();
      const normalized = normalizeImportedExcelData(buffer);
      if (!normalized) {
        message.error('Excel 内容不符合问卷格式');
        return false;
      }

      const { pageInfo, componentList, payload } = normalized;
      const selectedId = componentList.length > 0 ? componentList[0].fe_id : '';

      dispatch(resetComponents({ componentList, selectedId }));
      dispatch(ActionCreators.clearHistory());
      dispatch(resetPageInfo(pageInfo));

      if (id) {
        const messageKey = 'import-save';
        message.open({
          key: messageKey,
          type: 'loading',
          content: '导入成功，正在保存到服务器...',
          duration: 0,
        });
        try {
          // 把解析后的 payload 交给服务端做统一清洗与覆盖写入
          await saveToServer({ id, payload });
          message.success({
            key: messageKey,
            content: '导入并保存成功',
          });
        } catch (e) {
          message.error({
            key: messageKey,
            content: '导入成功，但保存失败',
          });
        }
      } else {
        message.success('导入成功');
      }
    } catch (e) {
      message.error('导入失败，请确认是有效 Excel 文件');
    }

    // 阻止 Upload 默认上传行为
    return false;
  };

  return (
    <Upload
      accept=".xlsx,.xls"
      showUploadList={false}
      beforeUpload={beforeUpload}
    >
      <Button loading={saving}>导入</Button>
    </Upload>
  );
};

export default EditImportButton;
