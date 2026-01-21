import 'reflect-metadata';
import mongoose from 'mongoose';

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
    await users.insertOne({
      username,
      password,
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
    await users.updateOne(
      { _id: existing._id },
      {
        $set: {
          role: 'admin',
          status: existing.status ?? 'active',
          nickname: existing.nickname ?? nickname,
          updatedAt: new Date(),
        },
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
