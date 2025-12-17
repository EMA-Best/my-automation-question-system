import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Question } from './schemas/question.schema';
import mongoose, { Model } from 'mongoose';
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
    // 在查询前校验 ObjectId，避免 CastError
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await this.questionModel.findById(id);
  }

  async delete(id: string, author: string) {
    // return await this.questionModel.findByIdAndDelete(id);
    return await this.questionModel.findOneAndDelete({ _id: id, author });
  }

  async update(id: string, questionDto: Question, author: string) {
    return await this.questionModel.updateOne(
      {
        _id: id,
        author,
      },
      questionDto,
    );
  }

  async findAllList({
    keyword = '',
    pageNum = 1,
    pageSize = 10,
    isDeleted = false,
    isStar,
    author = '',
  }) {
    const whereOpt: any = {
      author,
      isDeleted,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    if (isStar != null) whereOpt.isStar = isStar;

    if (keyword) {
      const reg = new RegExp(keyword, 'i');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      whereOpt.title = { $regex: reg }; // 标题模糊查询
    }

    return await this.questionModel
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      .find(whereOpt)
      .sort({ _id: -1 }) // 逆序排序
      .skip((pageNum - 1) * pageSize) // 分页
      .limit(pageSize); // 每页数量
  }

  async countAll({ keyword = '', isDeleted = false, author = '', isStar }) {
    const whereOpt: any = {
      author,
      isDeleted,
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    if (isStar != null) whereOpt.isStar = isStar;
    if (keyword) {
      const reg = new RegExp(keyword, 'i');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      whereOpt.title = { $regex: reg };
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return await this.questionModel.countDocuments(whereOpt);
  }

  async deleteMany(
    ids: string[],
    author: string,
  ): Promise<{ acknowledged: boolean; deletedCount: number }> {
    const res = await this.questionModel.deleteMany({
      _id: { $in: ids },
      author,
    });
    return res;
  }

  async duplicate(id: string, author: string) {
    const question = await this.questionModel.findById(id);
    const newQuestion = new this.questionModel({
      ...question!.toObject(),
      _id: new mongoose.Types.ObjectId(), // 新的mongodb ObjectId
      title: question!.title + ' 副本',
      author,
      isPublished: false,
      isStar: false,
      componentList: question?.componentList.map((item) => {
        return {
          ...item,
          fe_id: nanoid(), // 生成新的fe_id
        };
      }),
    });
    return await newQuestion.save();
  }
}
