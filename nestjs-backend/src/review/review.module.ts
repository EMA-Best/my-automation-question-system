import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  QuestionReview,
  QuestionReviewSchema,
} from './schemas/question-review.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QuestionReview.name, schema: QuestionReviewSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class ReviewModule {}
