import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Answer } from './schemas/answer.schema';

@Injectable()
export class AnswerService {
  // 依赖注入答卷模型
  constructor(@InjectModel(Answer.name) private readonly answerModel) {}

  async create(answerInfo: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!answerInfo.questionId) {
      throw new HttpException('缺少问卷ID', HttpStatus.BAD_REQUEST);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const answer = new this.answerModel(answerInfo);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return await answer.save();
  }
}
