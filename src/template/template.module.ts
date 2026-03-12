import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Question, QuestionSchema } from '../question/schemas/question.schema';
import { Answer, AnswerSchema } from '../answer/schemas/answer.schema';
import { Template, TemplateSchema } from './schemas/template.schema';
import { TemplateController } from './template.controller';
import { AdminTemplateController } from './admin-template.controller';
import { TemplateService } from './template.service';

/**
 * 模板模块
 *
 * 注册模板相关的控制器和服务。
 * 模板使用独立 templates 集合，
 * Question/Answer 模型仅用于“从问卷生成模板”和“使用模板创建问卷”等跨域操作。
 *
 * 控制器：
 *  - TemplateController —— C 端公开接口 + "使用模板"接口
 *  - AdminTemplateController —— 管理后台 CRUD 接口
 *
 * 导出 TemplateService 以便在其他模块中复用（如统计模块）。
 */
@Module({
  imports: [
    // 注入 Question 和 Answer 的 Mongoose Model，用于 TemplateService 查询
    MongooseModule.forFeature([
      { name: Template.name, schema: TemplateSchema },
      { name: Question.name, schema: QuestionSchema },
      { name: Answer.name, schema: AnswerSchema },
    ]),
  ],
  controllers: [TemplateController, AdminTemplateController],
  providers: [TemplateService],
  exports: [TemplateService], // 导出供其他模块使用
})
export class TemplateModule {}
