import 'reflect-metadata';
import mongoose from 'mongoose';

type LegacyQuestionTemplate = {
  _id: mongoose.Types.ObjectId;
  title?: string;
  templateDesc?: string;
  js?: string;
  css?: string;
  sort?: number;
  templateStatus?: 'draft' | 'published';
  author?: string;
  componentList?: Array<{
    fe_id?: string;
    type?: string;
    title?: string;
    isHidden?: boolean;
    isLocked?: boolean;
    props?: Record<string, unknown>;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
};

function normalizeComponentList(
  list: LegacyQuestionTemplate['componentList'],
): Array<{
  fe_id: string;
  type: string;
  title: string;
  isHidden: boolean;
  isLocked: boolean;
  props: Record<string, unknown>;
}> {
  const source = Array.isArray(list) ? list : [];
  return source
    .filter(
      (c) => c && typeof c.type === 'string' && typeof c.title === 'string',
    )
    .map((c) => ({
      fe_id: c.fe_id || new mongoose.Types.ObjectId().toString(),
      type: c.type as string,
      title: c.title as string,
      isHidden: c.isHidden ?? false,
      isLocked: c.isLocked ?? false,
      props:
        typeof c.props === 'object' && c.props != null
          ? (c.props as Record<string, unknown>)
          : {},
    }));
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

  const questions = db.collection<LegacyQuestionTemplate>('questions');
  const templates = db.collection('templates');

  const legacyTemplates = await questions.find({ isTemplate: true }).toArray();

  if (legacyTemplates.length === 0) {
    console.log('未发现 legacy 模板数据（questions.isTemplate=true）。');
    await mongoose.disconnect();
    return;
  }

  const ops = legacyTemplates.map((doc) => ({
    updateOne: {
      // 迁移时保留同一 _id，避免前端模板链接失效。
      filter: { _id: doc._id },
      update: {
        $set: {
          title: doc.title ?? '未命名模板',
          templateDesc: doc.templateDesc ?? '',
          js: doc.js ?? '',
          css: doc.css ?? '',
          sort: doc.sort ?? 0,
          templateStatus: doc.templateStatus ?? 'draft',
          author: doc.author ?? '',
          sourceQuestionId: String(doc._id),
          useCount: 0,
          componentList: normalizeComponentList(doc.componentList),
          createdAt: doc.createdAt ?? new Date(),
          updatedAt: doc.updatedAt ?? new Date(),
        },
      },
      upsert: true,
    },
  }));

  const result = await templates.bulkWrite(ops);
  console.log(
    `迁移完成：读取 ${legacyTemplates.length} 条，upsert ${result.upsertedCount} 条，更新 ${result.modifiedCount} 条。`,
  );

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('migrate templates failed:', err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
