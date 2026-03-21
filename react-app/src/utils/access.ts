import type { UserRole } from '../types/user';

export type Permission = 'manage:admin' | 'question:read:any';

const rolePermissionMap: Record<UserRole, readonly Permission[]> = {
  user: [],
  admin: ['manage:admin', 'question:read:any'],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissionMap[role].includes(permission);
}
