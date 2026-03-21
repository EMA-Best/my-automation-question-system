export type UserRole = 'user' | 'admin';

export type UserInfo = {
  username: string;
  nickname: string;
  role: UserRole;
  /**
   * 是否必须在下次登录后立即修改密码（例如管理员重置密码后）。
   * 后端未返回时前端默认视为 false。
   */
  mustChangePassword?: boolean;
};
