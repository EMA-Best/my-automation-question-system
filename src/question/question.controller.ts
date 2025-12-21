import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import {
  QuestionService,
  FindAllListParams,
  CountAllParams,
} from './question.service';
import { QuestionDto } from './dto/question.dto';
import { Public } from 'src/auth/decorators/public.decorator';

// 用户类型定义
export interface User {
  username: string;
}

@Controller('question')
export class QuestionController {
  // 依赖注入问题服务
  constructor(private readonly questionService: QuestionService) {}

  // NestJS的 @Query() 装饰器默认将所有查询参数解析为字符串类型
  @Get()
  async findAll(
    @Query('keyword') keyword: string = '',
    @Query('pageNum') pageNum: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('isDeleted') isDeleted: string = 'false',
    @Query('isStar') isStar: string = 'false',
    @Request() req: { user: User },
  ) {
    // 将字符串转换为布尔值
    const boolIsDeleted = isDeleted === 'true';
    const boolIsStar = isStar === 'true';

    console.log('isStar string:', isStar);
    console.log('isStar boolean:', boolIsStar);
    console.log('typeof isStar:', typeof boolIsStar);

    const { username } = req.user;
    // 将字符串转换为数字
    const numPageNum = parseInt(pageNum, 10);
    const numPageSize = parseInt(pageSize, 10);

    const findParams: FindAllListParams = {
      keyword,
      pageNum: numPageNum,
      pageSize: numPageSize,
      isDeleted: boolIsDeleted,
      isStar: boolIsStar,
      author: username,
    };

    const countParams: CountAllParams = {
      keyword,
      author: username,
      isDeleted: boolIsDeleted,
      isStar: boolIsStar,
    };

    const list = await this.questionService.findAllList(findParams);
    const count = await this.questionService.countAll(countParams);

    return {
      list,
      count,
    };
  }

  @Public() // 设置为公共接口 无需认证即可访问
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.questionService.findOne(id);
  }

  @Post()
  async create(@Request() req: { user: User }) {
    const { username } = req.user;
    return await this.questionService.create(username);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req: { user: User }) {
    const { username } = req.user;
    return await this.questionService.delete(id, username);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() questionDto: QuestionDto,
    @Request() req: { user: User },
  ) {
    const { username } = req.user;
    // 类型转换，确保QuestionDto包含必要的字段
    return await this.questionService.update(id, questionDto as any, username);
  }

  @Delete()
  async deleteMany(
    @Body() body: { ids: string[] },
    @Request() req: { user: User },
  ) {
    const { username } = req.user;
    const { ids = [] } = body;
    return await this.questionService.deleteMany(ids, username);
  }

  @Post('duplicate/:id')
  async duplicate(@Param('id') id: string, @Request() req: { user: User }) {
    const { username } = req.user;
    return await this.questionService.duplicate(id, username);
  }
}
