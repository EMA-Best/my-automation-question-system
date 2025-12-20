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
import { QuestionService } from './question.service';
import { QuestionDto } from './dto/question.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('question')
export class QuestionController {
  // 依赖注入问题服务
  constructor(private readonly questionService: QuestionService) {}

  @Get()
  async findAll(
    @Query('keyword') keyword: string,
    @Query('pageNum') pageNum: string,
    @Query('pageSize') pageSize: string,
    @Query('isDeleted') isDeleted: boolean = false,
    @Query('isStar') isStar: boolean = false,
    @Request() req,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const { username } = req.user;
    // 将字符串转换为数字
    const numPageNum = pageNum ? parseInt(pageNum, 10) : 1;
    const numPageSize = pageSize ? parseInt(pageSize, 10) : 10;
    const list = await this.questionService.findAllList({
      keyword,
      pageNum: numPageNum,
      pageSize: numPageSize,
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

  @Public() // 设置为公共接口 无需认证即可访问
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
  async delete(@Param('id') id: string, @Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const { username } = req.user;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
