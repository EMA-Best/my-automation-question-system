import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { QuestionService } from './question.service';
import { QuestionDto } from './dto/question.dto';

@Controller('question')
export class QuestionController {
  // 依赖注入问题服务
  constructor(private readonly questionService: QuestionService) {}

  @Get('test')
  getTest(): string {
    throw new HttpException('获取数据失败', HttpStatus.BAD_REQUEST);
  }

  @Get()
  async findAll(
    @Query('keyword') keyword: string,
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
  ) {
    const list = await this.questionService.findAllList({
      keyword,
      page,
      pageSize,
    });

    const count = await this.questionService.countAll({ keyword });

    return {
      list,
      count,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.questionService.findOne(id);
  }

  @Post()
  async create(@Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const { username } = req.user;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return await this.questionService.create(username);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.questionService.delete(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() questionDto: QuestionDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return await this.questionService.update(id, questionDto as any);
  }
}
