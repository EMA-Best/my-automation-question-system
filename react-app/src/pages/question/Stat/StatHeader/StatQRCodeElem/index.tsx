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
  const urlInputRef = useRef<InputRef>(null);
  const { id } = useParams();
  const { isPublished } = useGetPageInfo();

  const copy = () => {
    const elem = urlInputRef.current;
    if (elem == null) return;
    elem.select();
    document.execCommand('copy');
    message.success('复制成功');
  };

  if (!isPublished) return null;

  // Prefer configured C-site origin in production; fallback to current origin in local/dev.
  const cAppOriginRaw =
    process.env.REACT_APP_C_APP_ORIGIN || window.location.origin;
  const cAppOrigin = cAppOriginRaw.replace(/\/+$/, '');
  const url = `${cAppOrigin}/question/${id}`;

  const QRCodeElem = (
    <div style={{ textAlign: 'center' }}>
      <QRCodeSVG value={url} size={150}></QRCodeSVG>
    </div>
  );

  return (
    <Space>
      <Input value={url} style={{ width: '300px' }} ref={urlInputRef}></Input>
      <Tooltip title="复制链接">
        <Button icon={<CopyOutlined />} onClick={copy}></Button>
      </Tooltip>
      <Popover content={QRCodeElem} title="二维码">
        <Button icon={<QrcodeOutlined />}></Button>
      </Popover>
    </Space>
  );
};

export default StatQRCodeElem;
