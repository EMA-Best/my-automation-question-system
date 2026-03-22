import { Body, Controller, Post } from '@nestjs/common';
import { AnswerService } from './answer.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('answer')
export class AnswerController {
  // 依赖注入答卷服务
  constructor(private readonly answerService: AnswerService) {}

  @Public()
  @Post()
  async create(@Body() body) {
    console.log('C端提交的答卷数据： ', body);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.answerService.create(body);
  }
}
