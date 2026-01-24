import 'reflect-metadata';
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

function isBcryptHash(stored: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(stored);
}

async function hashPassword(plainPassword: string): Promise<string> {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(plainPassword, salt);
}

async function main() {
  const host = process.env.MONGO_HOST ?? 'localhost';
  const port = process.env.MONGO_PORT ?? '27017';
  const database = process.env.MONGO_DATABASE ?? 'question_db';

  // 默认值对齐前端规则：用户名 6~10，密码 6~12
  const username = process.env.ADMIN_USERNAME ?? 'admin01';
  const password = process.env.ADMIN_PASSWORD ?? 'admin123456';
  const nickname = process.env.ADMIN_NICKNAME ?? '管理员';

  const uri = process.env.MONGO_URI ?? `mongodb://${host}:${port}/${database}`;

  console.log(`MongoDB: ${uri}`);

  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB 连接未就绪（connection.db 为空）');
  }

  const users = db.collection('users');

  const existing = await users.findOne({ username });

  if (!existing) {
    const hashedPassword = await hashPassword(password);
    await users.insertOne({
      username,
      password: hashedPassword,
      nickname,
      role: 'admin',
      status: 'active',
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    });

    console.log(`已创建默认管理员账号：${username}`);
  } else {
    const existingPwd =
      typeof existing.password === 'string' ? existing.password : '';
    const passwordIsHashed = existingPwd ? isBcryptHash(existingPwd) : false;

    // 默认不强制重置密码：
    // - 若 ADMIN_PASSWORD 显式提供，则以它为准更新
    // - 否则仅在数据库仍是明文时做“迁移哈希”，并尽量保持原密码不变
    let nextPassword: string | undefined;
    if (process.env.ADMIN_PASSWORD) {
      nextPassword = await hashPassword(password);
    } else if (existingPwd && !passwordIsHashed) {
      nextPassword = await hashPassword(existingPwd);
    }

    const $set: Record<string, unknown> = {
      role: 'admin',
      status: existing.status ?? 'active',
      nickname: existing.nickname ?? nickname,
      updatedAt: new Date(),
    };

    if (nextPassword) {
      $set.password = nextPassword;
    }

    await users.updateOne(
      { _id: existing._id },
      {
        $set,
      },
    );

    console.log(`已更新账号为管理员：${username}`);
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('seed admin failed:', err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
