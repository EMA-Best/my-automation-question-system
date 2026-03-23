import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import * as mongoose from 'mongoose';
import { User } from './src/user/schemas/user.schema';
import { Question } from './src/question/schemas/question.schema';
import { Answer } from './src/answer/schemas/answer.schema';
import { Template } from './src/template/schemas/template.schema';
import { QuestionReview } from './src/review/schemas/question-review.schema';
import { AIReport } from './src/stat-report/schemas/ai-report.schema';

// 定义要同步的模型
const MODELS = [
  { name: 'User', model: User },
  { name: 'Question', model: Question },
  { name: 'Answer', model: Answer },
  { name: 'Template', model: Template },
  { name: 'QuestionReview', model: QuestionReview },
  { name: 'AIReport', model: AIReport },
];

async function seed() {
  console.log('Starting data synchronization...');
  
  // 加载配置
  ConfigModule.forRoot({ isGlobal: true });
  
  // 本地数据库连接
  const localUri = process.env.LOCAL_MONGO_URI || 'mongodb://localhost:27017/nestdb';
  console.log('Connecting to local database...');
  const localConnection = await mongoose.createConnection(localUri).asPromise();
  console.log('Connected to local database');
  
  // Atlas 数据库连接
  const atlasUri = process.env.DATABASE_URL;
  if (!atlasUri) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  console.log('Connecting to Atlas database...');
  const atlasConnection = await mongoose.createConnection(atlasUri).asPromise();
  console.log('Connected to Atlas database');
  
  try {
    for (const { name, model } of MODELS) {
      console.log(`\nProcessing ${name} data...`);
      
      // 获取本地模型
      const localModel = localConnection.model(name, model.schema);
      // 获取 Atlas 模型
      const atlasModel = atlasConnection.model(name, model.schema);
      
      // 读取本地数据
      const localData = await localModel.find({});
      console.log(`Found ${localData.length} ${name} records in local database`);
      
      if (localData.length > 0) {
        // 清空 Atlas 中的现有数据
        await atlasModel.deleteMany({});
        console.log(`Cleared existing ${name} records in Atlas`);
        
        // 插入本地数据到 Atlas
        await atlasModel.insertMany(localData);
        console.log(`Synced ${localData.length} ${name} records to Atlas`);
      }
    }
    
    console.log('\n✅ Data synchronization completed successfully!');
  } catch (error) {
    console.error('❌ Error during data synchronization:', error);
  } finally {
    // 关闭连接
    await localConnection.close();
    await atlasConnection.close();
    console.log('Connections closed');
  }
}

seed();
