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

  async count(questionId: string) {
    if (!questionId) return 0;
    // Mongoose v8 已移除 count()，使用 countDocuments()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return await this.answerModel.countDocuments({ questionId });
  }

  async findAll(questionId: string, opt: { page: number; pageSize: number }) {
    if (!questionId) return [];
    const { page = 1, pageSize = 10 } = opt;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const list = await this.answerModel
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .find({ questionId })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .skip((page - 1) * pageSize)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .limit(pageSize)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .sort({ createdAt: -1 }); // 按创建时间倒序排列
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return list;
  }
}
