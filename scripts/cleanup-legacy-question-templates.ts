import 'reflect-metadata';
import mongoose from 'mongoose';

type LegacyTemplateDoc = {
  _id: mongoose.Types.ObjectId;
  isTemplate?: boolean;
  templateStatus?: 'draft' | 'published';
  [key: string]: unknown;
};

type ArchiveDoc = LegacyTemplateDoc & {
  archivedAt: Date;
  archiveReason: string;
};

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

  const questions = db.collection<LegacyTemplateDoc>('questions');
  const archive = db.collection<ArchiveDoc>(
    'questions_template_legacy_archive',
  );

  // 仅清理“历史模板文档”：
  // - isTemplate=true
  // - templateStatus 字段存在（新流程里“源问卷已转模板”不会写该字段）
  const filter = {
    isTemplate: true,
    templateStatus: { $exists: true },
  };

  const legacyDocs = await questions.find(filter).toArray();
  if (legacyDocs.length === 0) {
    console.log('未发现可清理的历史模板文档。');
    await mongoose.disconnect();
    return;
  }

  console.log(`发现 ${legacyDocs.length} 条历史模板文档。`);

  if (dryRun) {
    console.log('DRY_RUN=true，仅输出统计，不执行归档和删除。');
    await mongoose.disconnect();
    return;
  }

  const now = new Date();
  const archiveOps = legacyDocs.map((doc) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: {
        $set: {
          ...doc,
          archivedAt: now,
          archiveReason:
            'template-split-phase1-cleanup: moved out of questions collection',
        },
      },
      upsert: true,
    },
  }));

  const archiveResult = await archive.bulkWrite(archiveOps, { ordered: false });

  const ids = legacyDocs.map((d) => d._id);
  const deleteResult = await questions.deleteMany({ _id: { $in: ids } });

  console.log(
    `清理完成：归档 upsert ${archiveResult.upsertedCount} 条，归档更新 ${archiveResult.modifiedCount} 条，删除 ${deleteResult.deletedCount} 条。`,
  );

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('cleanup legacy templates failed:', err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});
