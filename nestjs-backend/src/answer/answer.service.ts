/**
 * 答卷服务
 * 处理问卷答卷相关的业务逻辑
 */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Answer } from './schemas/answer.schema';
import { Model } from 'mongoose';

@Injectable()
export class AnswerService {
  /**
   * 构造函数
   * @param answerModel 答卷模型实例
   */
  constructor(@InjectModel(Answer.name) private readonly answerModel: Model<Answer>) {}

  /**
   * 创建答卷
   * @param answerInfo 答卷信息
   * @returns 创建的答卷对象
   * @throws 当缺少问卷ID时，抛出400错误
   */
  async create(answerInfo: any) {
    // 验证是否包含问卷ID
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!answerInfo.questionId) {
      throw new HttpException('缺少问卷ID', HttpStatus.BAD_REQUEST);
    }
    // 创建答卷实例并保存
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const answer = new this.answerModel(answerInfo);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return await answer.save();
  }

  /**
   * 统计问卷的答卷数量
   * @param questionId 问卷ID
   * @returns 答卷数量
   */
  async count(questionId: string) {
    if (!questionId) return 0;
    // Mongoose v8 已移除 count()，使用 countDocuments()
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return await this.answerModel.countDocuments({ questionId });
  }

  /**
   * 获取问卷的答卷列表
   * @param questionId 问卷ID
   * @param opt 分页参数
   * @returns 答卷列表
   */
  async findAll(questionId: string, opt: { page: number; pageSize: number }) {
    if (!questionId) return [];
    const { page = 1, pageSize = 10 } = opt;
    // 查询答卷列表，按创建时间倒序排列
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
