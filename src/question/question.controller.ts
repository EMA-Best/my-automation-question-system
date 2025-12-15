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
    @Query('isDeleted') isDeleted: boolean = false,
    @Query('isStar') isStar: boolean = false,
    @Request() req,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const { username } = req.user;
    const list = await this.questionService.findAllList({
      keyword,
      page,
      pageSize,
      isDeleted,
      isStar,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      author: username,
    });

    const count = await this.questionService.countAll({
      keyword,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      author: username,
      isDeleted,
      isStar,
    });

    return {
      list,
      count,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.questionService.findById(id);
  }

  @Post()
  async create(@Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const { username } = req.user;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return await this.questionService.create(username);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const { username } = req.user;
    return await this.questionService.delete(id, username);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() questionDto: QuestionDto,
    @Request() req,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const { username } = req.user;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return await this.questionService.update(id, questionDto as any, username);
  }

  @Delete()
  async deleteMany(@Body() body, @Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const { username } = req.user;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { ids = [] } = body;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return await this.questionService.deleteMany(ids, username);
  }

  @Post('duplicate/:id')
  async duplicate(@Param('id') id: string, @Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const { username } = req.user;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return await this.questionService.duplicate(id, username);
  }
}
