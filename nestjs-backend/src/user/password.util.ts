import * as bcrypt from 'bcryptjs';

const DEFAULT_SALT_ROUNDS = 10;

export function isBcryptHash(stored: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(stored);
}

export async function hashPassword(
  plainPassword: string,
  saltRounds: number = DEFAULT_SALT_ROUNDS,
): Promise<string> {
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(plainPassword, salt);
}

// 兼容旧数据：数据库里若仍是明文密码，继续按明文比对
export async function verifyPassword(
  plainPassword: string,
  storedPassword: string,
): Promise<boolean> {
  if (isBcryptHash(storedPassword)) {
    return await bcrypt.compare(plainPassword, storedPassword);
  }
  return plainPassword === storedPassword;
}
