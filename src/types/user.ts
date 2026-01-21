export type UserRole = 'user' | 'admin';

export type UserInfo = {
  username: string;
  nickname: string;
  role: UserRole;
};
