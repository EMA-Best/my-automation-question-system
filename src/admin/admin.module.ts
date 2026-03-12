import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminReviewController } from './admin-review.controller';
import { AdminReviewService } from './admin-review.service';
import { AdminQuestionController } from './admin-question.controller';
import { AdminQuestionService } from './admin-question.service';
import { AdminUserController } from './admin-user.controller';
import { AdminUserService } from './admin-user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Question, QuestionSchema } from '../question/schemas/question.schema';
import { ReviewModule } from '../review/review.module';
import { User, UserSchema } from '../user/schemas/user.schema';
import { Answer, AnswerSchema } from '../answer/schemas/answer.schema';
import { Template, TemplateSchema } from '../template/schemas/template.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Question.name, schema: QuestionSchema },
      { name: User.name, schema: UserSchema },
      { name: Answer.name, schema: AnswerSchema },
      { name: Template.name, schema: TemplateSchema },
    ]),
    ReviewModule,
  ],
  controllers: [
    AdminController,
    AdminReviewController,
    AdminQuestionController,
    AdminUserController,
  ],
  providers: [AdminReviewService, AdminQuestionService, AdminUserService],
})
export class AdminModule {}
