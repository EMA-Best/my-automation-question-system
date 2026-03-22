/**
 * 应用主模块
 * 配置并导入所有功能模块
 */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuestionModule } from './question/question.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AnswerModule } from './answer/answer.module';
import { StatModule } from './stat/stat.module';
import { AdminModule } from './admin/admin.module';
import { TemplateModule } from './template/template.module';
import { StatReportModule } from './stat-report/stat-report.module';

/**
 * AppModule 类
 * 应用的根模块，负责整合所有功能模块
 */
@Module({
  imports: [
    // 配置模块，加载环境变量
    ConfigModule.forRoot(),
    
    // MongoDB 数据库连接配置
    MongooseModule.forRoot(
      `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DATABASE}`,
    ),
    
    // 问卷模块
    QuestionModule,
    
    // 用户模块
    UserModule,
    
    // 认证模块
    AuthModule,
    
    // 答卷模块
    AnswerModule,
    
    // 统计模块
    StatModule,
    
    // 管理模块
    AdminModule,
    
    // 模板模块
    TemplateModule,
    
    // 统计报告模块
    StatReportModule,
  ],
  controllers: [
    // 应用控制器
    AppController,
  ],
  providers: [
    // 应用服务
    AppService,
  ],
})
export class AppModule {}
