import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Question } from './schemas/question.schema';
import { Model } from 'mongoose';
import { nanoid } from 'nanoid';

@Injectable()
export class QuestionService {
  constructor(
    // 依赖注入问题模型
    @InjectModel(Question.name) private readonly questionModel: Model<Question>,
  ) {}

  async create(username: string) {
    const question = new this.questionModel({
      title: '问卷标题' + Date.now(),
      desc: '问卷描述',
      author: username,
      componentList: [
        {
          fe_id: nanoid(),
          type: 'questionInfo',
          title: '问卷信息',
          props: { title: '问卷标题', desc: '问卷描述...' },
        },
      ],
    });
    return await question.save();
  }

  async findOne(id: string) {
    return await this.questionModel.findById(id);
  }

  async delete(id: string) {
    return await this.questionModel.findByIdAndDelete(id);
  }

  async update(id: string, questionDto: Question) {
    return await this.questionModel.findByIdAndUpdate(id, questionDto);
  }

  async findAllList({ keyword = '', page = 1, pageSize = 10 }) {
    const whereOpt: any = {};
    console.log('keyword', keyword);
    console.log('page', page);
    console.log('pageSize', pageSize);

    if (keyword) {
      const reg = new RegExp(keyword, 'i');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      whereOpt.title = { $regex: reg }; // 标题模糊查询
    }

    return await this.questionModel
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      .find(whereOpt)
      .sort({ _id: -1 }) // 逆序排序
      .skip((page - 1) * pageSize) // 分页
      .limit(pageSize); // 每页数量
  }

  async countAll({ keyword = '' }) {
    const whereOpt: any = {};
    if (keyword) {
      const reg = new RegExp(keyword, 'i');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      whereOpt.title = { $regex: reg };
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return await this.questionModel.countDocuments(whereOpt);
  }
}
