import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Question } from './schemas/question.schema';
import mongoose, { Model } from 'mongoose';
import { nanoid } from 'nanoid';

// 扩展 Question 类型，包含 answerCount 字段
export type QuestionWithAnswerCount = Question & {
  answerCount: number;
};

// 查询参数类型
export interface FindAllListParams {
  keyword?: string;
  pageNum?: number;
  pageSize?: number;
  isDeleted?: boolean;
  isStar?: boolean | null;
  author?: string;
}

// 统计参数类型
export interface CountAllParams {
  keyword?: string;
  isDeleted?: boolean;
  author?: string;
  isStar?: boolean | null;
}

@Injectable()
export class QuestionService {
  constructor(
    // 依赖注入问题模型
    @InjectModel(Question.name) private readonly questionModel: Model<Question>,
  ) {}

  async create(username: string): Promise<Question> {
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

  async findOne(id: string): Promise<Question | null> {
    // 在查询前校验 ObjectId，避免 CastError
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return await this.questionModel.findById(id);
  }

  async delete(id: string, author: string): Promise<Question | null> {
    // return await this.questionModel.findByIdAndDelete(id);
    return await this.questionModel.findOneAndDelete({ _id: id, author });
  }

  async update(
    id: string,
    questionDto: Question,
    author: string,
  ): Promise<mongoose.UpdateWriteOpResult> {
    return await this.questionModel.updateOne(
      {
        _id: id,
        author,
      },
      questionDto,
    );
  }

  async findAllList(
    params: FindAllListParams,
  ): Promise<QuestionWithAnswerCount[]> {
    console.log('params: ', params);

    const {
      keyword = '',
      pageNum = 1,
      pageSize = 10,
      isDeleted = false,
      isStar,
      author = '',
    } = params;

    const matchStage: {
      author: string;
      isDeleted: boolean;
      title?: { $regex: RegExp };
      isStar?: boolean;
    } = {
      author,
      isDeleted,
    };

    if (isStar != null) {
      matchStage.isStar = isStar;
    }

    if (keyword) {
      const reg = new RegExp(keyword, 'i');
      matchStage.title = { $regex: reg }; // 标题模糊查询
    }

    return await this.questionModel.aggregate<QuestionWithAnswerCount>([
      // 过滤条件
      { $match: matchStage },
      // 联合Answer表
      {
        $lookup: {
          from: 'answers', // 要联合的集合名
          let: { questionId: '$_id' }, // 将本地_id赋值给变量
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $toObjectId: '$questionId' }, // 将answer表中的questionId转换为ObjectId
                    '$$questionId', // 与本地_id变量匹配
                  ],
                },
              },
            },
          ],
          as: 'answerList', // 结果存放的字段名
        },
      },
      // 添加answerCount字段，统计答卷数量
      {
        $addFields: {
          answerCount: { $size: '$answerList' },
        },
      },
      // 移除不需要的answerList字段
      { $project: { answerList: 0 } },
      // 排序
      { $sort: { _id: -1 } },
      // 分页
      { $skip: (pageNum - 1) * pageSize },
      { $limit: pageSize },
    ]);
  }

  async countAll(params: CountAllParams): Promise<number> {
    const { keyword = '', isDeleted = false, author = '', isStar } = params;

    const whereOpt: {
      author: string;
      isDeleted: boolean;
      title?: { $regex: RegExp };
      isStar?: boolean;
    } = {
      author,
      isDeleted,
    };

    if (isStar != null) {
      whereOpt.isStar = isStar;
    }

    if (keyword) {
      const reg = new RegExp(keyword, 'i');
      whereOpt.title = { $regex: reg };
    }

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

  async duplicate(id: string, author: string): Promise<Question> {
    const question = await this.questionModel.findById(id);

    if (!question) {
      throw new Error('Question not found');
    }

    const newQuestion = new this.questionModel({
      ...question.toObject(),
      _id: new mongoose.Types.ObjectId(), // 新的mongodb ObjectId
      title: question.title + ' 副本',
      author,
      isPublished: false,
      isStar: false,
      componentList: question.componentList.map((item) => {
        return {
          ...item,
          fe_id: nanoid(), // 生成新的fe_id
        };
      }),
    });

    return await newQuestion.save();
  }
}
