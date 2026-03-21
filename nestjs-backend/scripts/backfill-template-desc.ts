import 'reflect-metadata';
import mongoose from 'mongoose';

type TemplateDoc = {
  _id: mongoose.Types.ObjectId;
  title?: string;
  templateDesc?: string | null;
};

function buildTemplateDesc(doc: TemplateDoc): string {
  const title = typeof doc.title === 'string' ? doc.title.trim() : '';
  if (title) return `这是关于《${title}》的问卷模板`;

  return '这是一个问卷模板';
}

async function main() {
  const host = process.env.MONGO_HOST ?? 'localhost';
  const port = process.env.MONGO_PORT ?? '27017';
  const database = process.env.MONGO_DATABASE ?? 'question_db';
  const uri = process.env.MONGO_URI ?? `mongodb://${host}:${port}/${database}`;

  console.log(`MongoDB: ${uri}`);
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB 连接未就绪（connection.db 为空）');
  }

  // 模板已拆表到 templates；不要再回写 questions，避免把旧模板字段引回去。
  const templates = db.collection<TemplateDoc>('templates');

  const filter = {
    $or: [
      { templateDesc: { $exists: false } },
      { templateDesc: null },
      { templateDesc: '' },
      { templateDesc: { $regex: '^\\s+$' } },
    ],
  } as const;

  const targets = await templates.find(filter).toArray();

  if (targets.length === 0) {
    console.log('无需回填：没有发现 templateDesc 为空的模板。');
    await mongoose.disconnect();
    return;
  }

  const now = new Date();
  const ops = targets.map((doc) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: {
        $set: {
          templateDesc: buildTemplateDesc(doc),
          updatedAt: now,
        },
      },
    },
  }));

  const result = await templates.bulkWrite(ops);

  console.log(
    `回填完成：匹配 ${targets.length} 条，实际更新 ${result.modifiedCount} 条。`,
  );

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('backfill templateDesc failed:', err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
