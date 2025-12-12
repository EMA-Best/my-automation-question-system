export class CreateUserDto {
  readonly username: string; // 用户名
  readonly password: string; // 密码
  readonly nickname?: string; // 昵称
}
