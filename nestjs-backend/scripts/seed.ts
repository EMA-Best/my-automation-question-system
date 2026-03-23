import 'reflect-metadata';
import mongoose from 'mongoose';

// 定义要同步的集合
const COLLECTIONS = [
  'users',
  'questions',
  'answers',
  'templates',
  'questionreviews',
  'aireports',
];

async function seed() {
  console.log('Starting data synchronization...');
  
  // 加载环境变量
  if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }
  
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
    for (const collectionName of COLLECTIONS) {
      console.log(`\nProcessing ${collectionName} collection...`);
      
      // 获取本地集合
      const localCollection = localConnection.db.collection(collectionName);
      // 获取 Atlas 集合
      const atlasCollection = atlasConnection.db.collection(collectionName);
      
      // 读取本地数据
      const localData = await localCollection.find({}).toArray();
      console.log(`Found ${localData.length} records in local ${collectionName} collection`);
      
      if (localData.length > 0) {
        // 清空 Atlas 中的现有数据
        await atlasCollection.deleteMany({});
        console.log(`Cleared existing records in Atlas ${collectionName} collection`);
        
        // 插入本地数据到 Atlas
        await atlasCollection.insertMany(localData);
        console.log(`Synced ${localData.length} records to Atlas ${collectionName} collection`);
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
