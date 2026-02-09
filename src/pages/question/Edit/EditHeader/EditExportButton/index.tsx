import { Button, message } from 'antd';
import { FC, useMemo } from 'react';
import useGetComponentInfo from '../../../../../hooks/useGetComponentInfo';
import useGetPageInfo from '../../../../../hooks/useGetPageInfo';
import useGetUserInfo from '../../../../../hooks/useGetUserInfo';

import {
  buildQuestionExportFileName,
  exportQuestionToXlsx,
} from '../../../../../utils/exportQuestion';

const EditExportButton: FC = () => {
  const { componentList = [] } = useGetComponentInfo();
  const pageInfo = useGetPageInfo();
  const { username, nickname } = useGetUserInfo();

  const fileName = useMemo(() => {
    return buildQuestionExportFileName(pageInfo.title || '问卷');
  }, [pageInfo.title]);

  const handleExport = () => {
    try {
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

      exportQuestionToXlsx({
        question: questionRow,
        componentList,
        fileName,
      });
    } catch (e) {
      message.error('导出失败');
    }
  };

  return <Button onClick={handleExport}>导出</Button>;
};

export default EditExportButton;
