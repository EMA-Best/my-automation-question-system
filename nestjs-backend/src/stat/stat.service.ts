/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AnswerService } from '../answer/answer.service';
import { QuestionService } from '../question/question.service';
import type { Model } from 'mongoose';
import { Answer } from '../answer/schemas/answer.schema';
import { Question } from '../question/schemas/question.schema';

type answerComListType = {
  name: string;
  count: number;
}[];

export type HomeOverviewStat = {
  createdCount: number;
  publishedCount: number;
  answerCount: number;
};

export type AnswerCountItem = { questionId: string; answerCount: number };
export type AnswerCountResponse = { list: AnswerCountItem[] };

@Injectable()
export class StatService {
  // 依赖注入AnswerService和QuestionService
  constructor(
    private readonly answerService: AnswerService,
    private readonly questionService: QuestionService,
    @InjectModel(Answer.name) private readonly answerModel: Model<Answer>,
    @InjectModel(Question.name) private readonly questionModel: Model<Question>,
  ) {}

  // 获取单选按钮的选项文本
  private _getRadioOptText(value: any, props: any = {}) {
    console.log('cur value: ', value);
    console.log('cur props: ', props);
    const { options = [] } = props;
    for (const item of options) {
      if (item.value === value) {
        return item.text;
      }
    }
    return value; // 如果找不到匹配的选项，返回原始值
  }

  // 获取多选按钮的选项文本
  private _getCheckboxOptText(value: any, props: any = {}) {
    const { options = [] } = props;
    for (const item of options) {
      if (item.value === value) {
        return item.text;
      }
    }
    return value; // 如果找不到匹配的选项，返回原始值
  }

  // 生成答卷信息
  private _genAnswersInfo(question: any, answerList: any[] = []) {
    console.log('current question: ', question);
    console.log('answerList: ', answerList);

    const res: Record<string, any> = {};
    const componentList: any[] = question?.componentList || [];

    // console.log('componentList: ', componentList);

    // console.log('answerList: ', answerList);

    answerList.forEach((item) => {
      const componentFeId =
        item.componentFeId || item.fe_id || item.componentId || item.id || '';
      // item.value的值不是null或undefined时，赋值给rawValue，否则赋值为空数组
      const rawValue = item.value ?? [];
      const valueArr = Array.isArray(rawValue) ? rawValue : [rawValue];

      const comp = componentList.find((c) => c.fe_id === componentFeId);
      if (!comp) {
        // 组件缺失时直接回填原始值
        res[componentFeId] = valueArr.toString();
        return;
      }

      const { type, props = {} } = comp;
      if (type === 'questionRadio') {
        res[componentFeId] = valueArr
          .map((v) => this._getRadioOptText(v, props))
          .toString();
      } else if (type === 'questionCheckbox') {
        // 针对多选组件，先检查是否有选项数据
        const options = props.options || [];
        if (options.length === 0) {
          // 如果没有选项数据，直接使用原始值
          res[componentFeId] = valueArr.toString();
        } else {
          // 否则转换为选项文本
          res[componentFeId] = valueArr
            .map((v) => this._getCheckboxOptText(v, props))
            .toString();
        }
      } else {
        res[componentFeId] = valueArr.toString();
      }
    });
    // console.log('res: ', res);

    return res;
  }

  // 获取单个问卷的答卷列表和数量
  async getQuestionStatListAndCount(
    questionId: string,
    opt: { page: number; pageSize: number },
  ) {
    const noData = { list: [], total: 0 };
    if (!questionId) return noData;
    const q = await this.questionService.findOne(questionId);
    if (q == null) return noData;
    const total = await this.answerService.count(questionId);
    if (total === 0) return noData;
    const answerList = await this.answerService.findAll(questionId, opt);

    // console.log('getQuestionStatListAndCount answerList: ', answerList);

    const list = answerList.map((answer: any) => {
      // {_id:'',componentId: '', value: ''}
      return {
        _id: answer._id,
        ...this._genAnswersInfo(q, (answer.answerList || []) as any[]),
      };
    });

    // console.log('getQuestionStatListAndCount list: ', list);

    return {
      list,
      total,
    };
  }

  // 获取单个组件的统计数据
  async getComponentStat(questionId: string, componentFeId: string) {
    if (!questionId || !componentFeId) return [];
    // 获取问卷
    const q = await this.questionService.findOne(questionId); // 找到对应问卷
    if (q == null) return [];

    // 获取组件
    const { componentList = [] } = q;
    const comp = componentList.filter((c) => c.fe_id === componentFeId)[0];
    if (comp == null) return [];

    const { type, props } = comp;
    if (type !== 'questionRadio' && type !== 'questionCheckbox') return [];

    // 获取答卷列表
    const total = await this.answerService.count(questionId);
    if (total === 0) return []; // 答卷总数量
    const answers = await this.answerService.findAll(questionId, {
      page: 1,
      pageSize: total, // 获取所有答卷
    });

    const countInfo: Record<string, number> = {};
    answers.forEach((answer: any) => {
      const answerList = answer.answerList || [];
      answerList.forEach((item: any) => {
        const curComponentFeId =
          item.componentFeId || item.fe_id || item.componentId || item.id || '';
        if (curComponentFeId !== componentFeId) return;
        const values = Array.isArray(item.value) ? item.value : [item.value];
        values.forEach((v) => {
          if (countInfo[v] == null) countInfo[v] = 0;
          countInfo[v]++; // 累加
        });
      });
    });

    // 整理数据
    const list: answerComListType = [];

    console.log('countInfo: ', countInfo);

    for (const val in countInfo) {
      // 根据val计算text
      let text = '';
      if (type === 'questionRadio') {
        text = this._getRadioOptText(val, props);
      }
      if (type === 'questionCheckbox') {
        text = this._getCheckboxOptText(val, props);
      }
      list.push({
        name: text,
        count: countInfo[val],
      });
    }
    return list;
  }

  // 获取首页统计数据
  async getOverview(): Promise<HomeOverviewStat> {
    const baseQuestionFilter = { isDeleted: false };

    const [createdCount, publishedCount] = await Promise.all([
      this.questionModel.countDocuments(baseQuestionFilter),
      this.questionModel.countDocuments({
        ...baseQuestionFilter,
        isPublished: true,
      }),
    ]);

    const agg = await this.answerModel.aggregate<{ count: number }>([
      {
        $lookup: {
          from: 'questions',
          let: { qid: '$questionId' },
          pipeline: [
            { $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$qid'] } } },
            { $match: { isDeleted: false } },
            { $project: { _id: 1 } },
          ],
          as: 'q',
        },
      },
      { $match: { 'q.0': { $exists: true } } },
      { $count: 'count' },
    ]);
    const answerCount = agg[0]?.count ?? 0;

    return { createdCount, publishedCount, answerCount };
  }

  // 批量统计：一次请求拿到一组问卷的答卷数（缺失补 0）
  async getAnswerCountByQuestionIds(
    questionIds: string[],
  ): Promise<AnswerCountResponse> {
    const trimmed = questionIds
      .map((id) => (typeof id === 'string' ? id.trim() : ''))
      .filter(Boolean);

    // 去重但保持顺序
    const uniqueIds: string[] = [];
    const seen = new Set<string>();
    for (const id of trimmed) {
      if (seen.has(id)) continue;
      seen.add(id);
      uniqueIds.push(id);
    }

    if (uniqueIds.length === 0) {
      return { list: [] };
    }

    const agg = await this.answerModel.aggregate<{
      _id: string;
      answerCount: number;
    }>([
      { $match: { questionId: { $in: uniqueIds } } },
      { $group: { _id: '$questionId', answerCount: { $sum: 1 } } },
    ]);

    const countMap = new Map<string, number>();
    for (const row of agg) {
      if (row && typeof row._id === 'string') {
        countMap.set(
          row._id,
          typeof row.answerCount === 'number' ? row.answerCount : 0,
        );
      }
    }

    const list: AnswerCountItem[] = uniqueIds.map((questionId) => ({
      questionId,
      answerCount: countMap.get(questionId) ?? 0,
    }));

    return { list };
  }
}
