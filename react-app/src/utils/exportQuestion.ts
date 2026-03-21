import type { ComponentInfoType } from '../store/componentsReducer';
import type { QuestionDetail } from '../services/question';
import * as XLSX from 'xlsx';

export type ExportQuestionRow = {
  title: string;
  desc: string;
  author: string;
  js: string;
  css: string;
  isPublished: boolean;
  isStar: boolean;
  isDeleted: boolean;
};

export function sanitizeFileName(name: string): string {
  // Windows 不允许的文件名字符: \ / : * ? " < > |
  return name.replace(/[\\/:*?"<>|]/g, '_').trim();
}

export function buildQuestionExportFileName(
  title: string,
  date: Date = new Date()
): string {
  const safeTitle = sanitizeFileName(title || '问卷');
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${safeTitle}-${yyyy}${mm}${dd}.xlsx`;
}

export function exportQuestionToXlsx(params: {
  question: ExportQuestionRow;
  componentList: ComponentInfoType[];
  fileName: string;
}): void {
  const { question, componentList, fileName } = params;

  const workbook = XLSX.utils.book_new();

  // 对齐后端 Question schema 的字段
  const questionSheet = XLSX.utils.json_to_sheet([question], {
    header: [
      'title',
      'desc',
      'author',
      'js',
      'css',
      'isPublished',
      'isStar',
      'isDeleted',
    ],
  });
  XLSX.utils.book_append_sheet(workbook, questionSheet, 'question');

  const componentRows = (componentList ?? []).map((c) => ({
    fe_id: c.fe_id,
    type: c.type,
    title: c.title,
    isHidden: c.isHidden ?? false,
    isLocked: c.isLocked ?? false,
    props: JSON.stringify(c.props ?? {}),
  }));
  const componentSheet = XLSX.utils.json_to_sheet(componentRows, {
    header: ['fe_id', 'type', 'title', 'isHidden', 'isLocked', 'props'],
  });
  XLSX.utils.book_append_sheet(workbook, componentSheet, 'componentList');

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

export async function exportQuestionById(params: {
  id: string;
  title?: string;
  author?: string;
  isStar?: boolean;
  isDeleted?: boolean;
  // eslint-disable-next-line no-unused-vars
  loadDetail: (id: string) => Promise<QuestionDetail>;
}): Promise<void> {
  const detail = await params.loadDetail(params.id);

  const title = params.title ?? detail.title ?? '问卷';
  const fileName = buildQuestionExportFileName(title);

  const questionRow: ExportQuestionRow = {
    title,
    desc: detail.desc ?? '',
    author: params.author ?? '',
    js: detail.js ?? '',
    css: detail.css ?? '',
    isPublished: detail.isPublished ?? false,
    isStar: params.isStar ?? false,
    isDeleted: params.isDeleted ?? false,
  };

  exportQuestionToXlsx({
    question: questionRow,
    componentList: detail.componentList ?? [],
    fileName,
  });
}
