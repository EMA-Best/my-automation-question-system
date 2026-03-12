import 'reflect-metadata';
import mongoose from 'mongoose';

async function main() {
  const host = process.env.MONGO_HOST ?? 'localhost';
  const port = process.env.MONGO_PORT ?? '27017';
  const database = process.env.MONGO_DATABASE ?? 'question_db';
  const uri = process.env.MONGO_URI ?? `mongodb://${host}:${port}/${database}`;
  const dryRun = process.env.DRY_RUN === 'true';

  console.log(`MongoDB: ${uri}`);
  console.log(`DRY_RUN: ${dryRun}`);

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB 连接未就绪（connection.db 为空）');
  }

  const questions = db.collection('questions');

  const filter = {
    $or: [
      { isTemplate: { $exists: true } },
      { templateStatus: { $exists: true } },
      { templateDesc: { $exists: true } },
      { cover: { $exists: true } },
      { category: { $exists: true } },
      { tags: { $exists: true } },
      { sort: { $exists: true } },
    ],
  };

  const count = await questions.countDocuments(filter);
  console.log(`命中 ${count} 条 question 文档。`);

  if (count === 0 || dryRun) {
    await mongoose.disconnect();
    return;
  }

  const res = await questions.updateMany(filter, {
    $unset: {
      isTemplate: '',
      templateStatus: '',
      templateDesc: '',
      cover: '',
      category: '',
      tags: '',
      sort: '',
    },
  });

  console.log(
    `清理完成：匹配 ${res.matchedCount} 条，更新 ${res.modifiedCount} 条。`,
  );

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('cleanup question template fields failed:', err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
