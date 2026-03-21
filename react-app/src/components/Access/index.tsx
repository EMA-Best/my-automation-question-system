import type { FC, PropsWithChildren, ReactNode } from 'react';
import type { Permission } from '../../utils/access';
import { hasPermission } from '../../utils/access';
import useGetUserInfo from '../../hooks/useGetUserInfo';

type Props = PropsWithChildren<{
  need: Permission;
  fallback?: ReactNode;
}>;

const Access: FC<Props> = (props) => {
  const { need, fallback = null, children } = props;
  const { role } = useGetUserInfo();

  if (!hasPermission(role, need)) return <>{fallback}</>;
  return <>{children}</>;
};

export default Access;
