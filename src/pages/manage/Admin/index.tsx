import type { FC } from 'react';
import { Card, Typography } from 'antd';

const { Title, Paragraph } = Typography;

const Admin: FC = () => {
  return (
    <Card>
      <Title level={3}>管理后台</Title>
      <Paragraph>
        这里建议放：用户管理、问卷审核/全量问卷列表、系统统计等。
      </Paragraph>
      <Paragraph type="secondary">
        注意：真正的权限控制必须由后端校验（token/role/权限点），前端只做路由拦截与
        UI 控制。
      </Paragraph>
    </Card>
  );
};

export default Admin;
