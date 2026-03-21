export type Role = 'user' | 'admin';

export type Permission =
  | 'manage:admin'
  | 'user:read'
  | 'user:update'
  | 'user:resetPassword'
  | 'user:delete'
  | 'question:read:any'
  | 'question:update:any'
  | 'question:feature'
  | 'template:manage'
  | 'review:read'
  | 'review:approve'
  | 'review:reject';

export const ALL_ADMIN_PERMISSIONS: Permission[] = [
  'manage:admin',
  'user:read',
  'user:update',
  'user:resetPassword',
  'user:delete',
  'question:read:any',
  'question:update:any',
  'question:feature',
  'template:manage',
  'review:read',
  'review:approve',
  'review:reject',
];

export function permissionsForRole(role: string | undefined): Permission[] {
  if (role === 'admin') return ALL_ADMIN_PERMISSIONS;
  return [];
}
