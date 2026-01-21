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
  Res,
} from '@nestjs/common';
import {
  QuestionService,
  FindAllListParams,
  CountAllParams,
  QuestionUpdateResult,
} from './question.service';
import { OptionalAuth } from 'src/auth/decorators/optional-auth.decorator';
import { AIGenerateQuestionDto } from './dto/ai-generate.dto';
import type { Response, Request as ExpressRequest } from 'express';
import type { AIGenerateStreamHandlers } from '../ai/ai.service';

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
    @Query('isStar') isStar: string | undefined = undefined,
    @Request() req: { user: User },
  ) {
    // 将字符串转换为布尔值
    const boolIsDeleted = isDeleted === 'true';
    // 将isStar转换为boolean | null，只有当明确传递'true'时才为true，否则为null
    const parsedIsStar =
      isStar === 'true' ? true : isStar === 'false' ? false : null;

    const { username } = req.user;
    // 将字符串转换为数字
    const numPageNum = parseInt(pageNum, 10);
    const numPageSize = parseInt(pageSize, 10);

    const findParams: FindAllListParams = {
      keyword,
      pageNum: numPageNum,
      pageSize: numPageSize,
      isDeleted: boolIsDeleted,
      isStar: parsedIsStar,
      author: username,
    };

    const countParams: CountAllParams = {
      keyword,
      author: username,
      isDeleted: boolIsDeleted,
      isStar: parsedIsStar,
    };

    const list = await this.questionService.findAllList(findParams);
    const count = await this.questionService.countAll(countParams);

    return {
      list,
      count,
    };
  }

  @Get(':id')
  @OptionalAuth()
  async findOne(@Param('id') id: string, @Request() req: { user?: User }) {
    const username = req.user?.username;
    return await this.questionService.findOnePublic(id, username);
  }

  @Get(':id/export')
  async exportQuestion(
    @Param('id') id: string,
    @Request() req: { user: User },
  ) {
    const { username } = req.user;
    return await this.questionService.exportQuestion(id, username);
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
    @Body() questionDto: unknown,
    @Request() req: { user: User },
  ): Promise<QuestionUpdateResult> {
    const { username } = req.user;
    return await this.questionService.update(id, questionDto, username);
  }

  @Post('import')
  async importQuestion(@Body() body: unknown, @Request() req: { user: User }) {
    const { username } = req.user;
    return await this.questionService.importQuestion(body, username);
  }

  // 覆盖导入：把导入内容写入当前问卷（不新建）
  @Post(':id/import')
  async importIntoQuestion(
    @Param('id') id: string,
    @Body() body: unknown,
    @Request() req: { user: User },
  ): Promise<QuestionUpdateResult> {
    const { username } = req.user;
    return await this.questionService.importIntoQuestion(id, body, username);
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

  // 提交审核（迭代B）
  @Post(':id/submit-review')
  async submitReview(@Param('id') id: string, @Request() req: { user: User }) {
    const { username } = req.user;
    return await this.questionService.submitReview(id, username);
  }

  @Post('ai-generate')
  async aiGenerate(
    @Body() aiGenerateDto: AIGenerateQuestionDto,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Request() req: { user: User },
  ) {
    console.log('aiGenerateDto: ', aiGenerateDto);

    // 注意：这里不需要 username，因为只是生成结构，不直接保存
    // 前端会在预览确认后调用 import 或 importIntoQuestion 来保存
    return await this.questionService.aiGenerateQuestion(aiGenerateDto.prompt);
  }

  // SSE 流式生成（ChatGPT 风格对话 + 结构化预览）
  @Post('ai-generate/stream')
  async aiGenerateStream(
    @Body() body: unknown,
    @Request() req: ExpressRequest,
    @Res() res: Response,
  ): Promise<void> {
    const prompt =
      typeof body === 'object' && body != null && 'prompt' in body
        ? (body as { prompt?: unknown }).prompt
        : '';
    const promptStr = typeof prompt === 'string' ? prompt : '';

    if (!promptStr.trim()) {
      // SSE 下也遵循项目异常语义：但已开始写 header 时不能抛；这里尚未写入
      res.status(400);
      res.json({ errno: -1, message: 'prompt 不能为空' });
      return;
    }
    if (promptStr.length > 2000) {
      res.status(400);
      res.json({ errno: -1, message: 'prompt 长度不能超过2000字符' });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    // 允许 nginx 关闭缓冲（如果存在反代）
    res.setHeader('X-Accel-Buffering', 'no');

    // 注意：不能把方法解构出来直接调用，否则 this 会丢失导致 node:_http_outgoing 报错
    const maybeFlushHeaders = (res as unknown as { flushHeaders?: () => void })
      .flushHeaders;
    if (typeof maybeFlushHeaders === 'function') {
      maybeFlushHeaders.call(res);
    }

    const writeSse = (event: string, data: unknown) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // 心跳，防止代理断开
    const heartbeat = setInterval(() => {
      writeSse('ping', { t: Date.now() });
    }, 15000);

    const abortController = new AbortController();

    let closed = false;

    const cleanup = () => {
      if (closed) return;
      closed = true;
      clearInterval(heartbeat);
      abortController.abort();
      try {
        res.end();
      } catch {
        // ignore
      }
    };

    // 客户端断开时停止生成
    req.on('close', cleanup);

    const handlers: AIGenerateStreamHandlers = {
      onEvent: (eventName: string, payload: unknown) => {
        writeSse(eventName, payload);
      },
      onClose: () => {
        cleanup();
      },
    };

    try {
      await this.questionService.aiGenerateQuestionStream(
        promptStr,
        handlers,
        abortController.signal,
      );
    } catch (err) {
      // SSE 场景：不要让 Nest 的异常过滤器接管（否则会尝试返回 JSON，导致 Content-Type mismatch）
      writeSse('error', {
        message: err instanceof Error ? err.message : 'AI 流式生成失败',
      });
    }

    // 正常结束
    cleanup();
  }
}
