/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { AnswerService } from 'src/answer/answer.service';
import { QuestionService } from 'src/question/question.service';

type answerComListType = {
  name: string;
  count: number;
}[];

@Injectable()
export class StatService {
  // 依赖注入AnswerService和QuestionService
  constructor(
    private readonly answerService: AnswerService,
    private readonly questionService: QuestionService,
  ) {}

  private _getRadioOptText(value: any, props: any = {}) {
    const { options = [] } = props;
    for (const item of options) {
      if (item.value === value) {
        return item.text;
      }
    }
    return value; // 如果找不到匹配的选项，返回原始值
  }

  private _getCheckboxOptText(value: any, props: any = {}) {
    const { options = [] } = props;
    for (const item of options) {
      if (item.value === value) {
        return item.text;
      }
    }
    return value; // 如果找不到匹配的选项，返回原始值
  }

  private _genAnswersInfo(question: any, answerList: any[] = []) {
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

    console.log('getQuestionStatListAndCount answerList: ', answerList);

    const list = answerList.map((answer: any) => {
      // {_id:'',componentId: '', value: ''}
      return {
        _id: answer._id,
        ...this._genAnswersInfo(q, (answer.answerList || []) as any[]),
      };
    });

    console.log('getQuestionStatListAndCount list: ', list);

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
}
