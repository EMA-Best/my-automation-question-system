import { Button, message } from 'antd';
import { FC, useMemo } from 'react';
import useGetComponentInfo from '../../../../../hooks/useGetComponentInfo';
import useGetPageInfo from '../../../../../hooks/useGetPageInfo';
import * as XLSX from 'xlsx';
import useGetUserInfo from '../../../../../hooks/useGetUserInfo';

function sanitizeFileName(name: string) {
  // Windows 不允许的文件名字符: \ / : * ? " < > |
  return name.replace(/[\\/:*?"<>|]/g, '_').trim();
}

const EditExportButton: FC = () => {
  const { componentList = [] } = useGetComponentInfo();
  const pageInfo = useGetPageInfo();
  const { username, nickname } = useGetUserInfo();

  const fileName = useMemo(() => {
    const title = sanitizeFileName(pageInfo.title || '问卷');
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${title}-${yyyy}${mm}${dd}.xlsx`;
  }, [pageInfo.title]);

  const handleExport = () => {
    try {
      const workbook = XLSX.utils.book_new();

      // 对齐后端 Question schema 的字段
      const questionRow = {
        title: pageInfo.title || '',
        desc: pageInfo.desc || '',
        author: username || nickname || '',
        js: pageInfo.js || '',
        css: pageInfo.css || '',
        isPublished: pageInfo.isPublished ?? false,
        isStar: (pageInfo as unknown as { isStar?: boolean }).isStar ?? false,
        isDeleted:
          (pageInfo as unknown as { isDeleted?: boolean }).isDeleted ?? false,
      };
      const questionSheet = XLSX.utils.json_to_sheet([questionRow], {
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

      const componentRows = componentList.map((c) => ({
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
    } catch (e) {
      message.error('导出失败');
    }
  };

  return <Button onClick={handleExport}>导出</Button>;
};

export default EditExportButton;
