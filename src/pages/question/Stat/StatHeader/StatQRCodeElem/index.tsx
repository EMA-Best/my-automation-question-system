import {
  Button,
  Input,
  InputRef,
  message,
  Popover,
  Space,
  Tooltip,
} from 'antd';
import { FC, useRef } from 'react';
import useGetPageInfo from '../../../../../hooks/useGetPageInfo';
import { useParams } from 'react-router-dom';
import { CopyOutlined, QrcodeOutlined } from '@ant-design/icons';
import { QRCodeSVG } from 'qrcode.react';

const StatQRCodeElem: FC = () => {
  // 问卷链接输入框的引用
  const urlInputRef = useRef<InputRef>(null);
  const { id } = useParams();
  const { isPublished } = useGetPageInfo();
  // 拷贝链接
  const copy = () => {
    const elem = urlInputRef.current;
    if (elem == null) return;
    elem.select();
    document.execCommand('copy');
    message.success('拷贝成功');
  };

  // 未发布的问卷不展示二维码
  if (!isPublished) return null;

  // 拼接url 需要参考C端的规则
  const url = `http://localhost:3000/question/${id}`;

  // 二维码组件
  const QRCodeElem = (
    <div style={{ textAlign: 'center' }}>
      <QRCodeSVG value={url} size={150}></QRCodeSVG>
    </div>
  );
  return (
    <Space>
      <Input value={url} style={{ width: '300px' }} ref={urlInputRef}></Input>
      <Tooltip title="拷贝链接">
        <Button icon={<CopyOutlined />} onClick={copy}></Button>
      </Tooltip>
      <Popover content={QRCodeElem} title="二维码">
        <Button icon={<QrcodeOutlined />}></Button>
      </Popover>
    </Space>
  );
};

export default StatQRCodeElem;
