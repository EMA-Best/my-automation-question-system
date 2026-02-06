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
import { Public } from 'src/auth/decorators/public.decorator';
import { AIGenerateQuestionDto } from './dto/ai-generate.dto';
import type { Response, Request as ExpressRequest } from 'express';
import type { AIGenerateStreamHandlers } from '../ai/ai.service';

// 用户类型定义
export interface User {
  username: string;
}

// 说明：该文件原先拆成了两个 Controller（QuestionController + QuestionsPublicController）。
// 为了减少不必要的类拆分，同时保持路由不变，这里统一改为“根 Controller”，
// 并在每个方法上显式写全路径：
// - 私有/登录态接口仍为 /api/question/...
// - 公开接口仍为 /api/questions/...
@Controller()
export class QuestionController {
  // 依赖注入问题服务
  constructor(private readonly questionService: QuestionService) {}

  // NestJS的 @Query() 装饰器默认将所有查询参数解析为字符串类型
  @Get('question')
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

  @Get('question/:id')
  @OptionalAuth()
  async findOne(@Param('id') id: string, @Request() req: { user?: User }) {
    const username = req.user?.username;
    return await this.questionService.findOnePublic(id, username);
  }

  @Get('question/:id/export')
  async exportQuestion(
    @Param('id') id: string,
    @Request() req: { user: User },
  ) {
    const { username } = req.user;
    return await this.questionService.exportQuestion(id, username);
  }

  @Post('question')
  async create(@Request() req: { user: User }) {
    const { username } = req.user;
    return await this.questionService.create(username);
  }

  @Delete('question/:id')
  async delete(@Param('id') id: string, @Request() req: { user: User }) {
    const { username } = req.user;
    return await this.questionService.delete(id, username);
  }

  @Patch('question/:id')
  async update(
    @Param('id') id: string,
    @Body() questionDto: unknown,
    @Request() req: { user: User },
  ): Promise<QuestionUpdateResult> {
    const { username } = req.user;
    return await this.questionService.update(id, questionDto, username);
  }

  @Post('question/import')
  async importQuestion(@Body() body: unknown, @Request() req: { user: User }) {
    const { username } = req.user;
    return await this.questionService.importQuestion(body, username);
  }

  // 覆盖导入：把导入内容写入当前问卷（不新建）
  @Post('question/:id/import')
  async importIntoQuestion(
    @Param('id') id: string,
    @Body() body: unknown,
    @Request() req: { user: User },
  ): Promise<QuestionUpdateResult> {
    const { username } = req.user;
    return await this.questionService.importIntoQuestion(id, body, username);
  }

  @Delete('question')
  async deleteMany(
    @Body() body: { ids: string[] },
    @Request() req: { user: User },
  ) {
    const { username } = req.user;
    const { ids = [] } = body;
    return await this.questionService.deleteMany(ids, username);
  }

  @Post('question/duplicate/:id')
  async duplicate(@Param('id') id: string, @Request() req: { user: User }) {
    const { username } = req.user;
    return await this.questionService.duplicate(id, username);
  }

  // 提交审核（迭代B）
  @Post('question/:id/submit-review')
  async submitReview(@Param('id') id: string, @Request() req: { user: User }) {
    const { username } = req.user;
    return await this.questionService.submitReview(id, username);
  }

  @Post('question/ai-generate')
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
  @Post('question/ai-generate/stream')
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

  /**
   * 公共问卷接口（给首页/公开页使用）
   *
   * 注意：项目在 main.ts 里设置了全局前缀 app.setGlobalPrefix('api')。
   * 因此这里真实访问路径是：
   * - /api/questions/...
   *
   * 另外：项目有全局 TransformInterceptor，会把所有接口响应统一包装成：
   * { errno: 0, data: ... }
   *
   * @Public() 表示跳过登录校验（没有 token 也能访问）。
   */

  /**
   * 获取热门问卷列表（置顶/推荐）
   *
   * 前端调用：GET /api/questions/featured
   * 返回字段里包含：题目数量(questionCount) + 答卷数量(answerCount)
   *
   * 公开接口约束：
   * - 只返回未删除(isDeleted=false) 且已发布(isPublished=true) 的问卷
   * - 只返回 featured=true 或 pinned=true 的问卷
   */
  @Public()
  @Get('questions/featured')
  async getFeaturedQuestions() {
    // 直接复用 QuestionService 的实现，保持业务逻辑集中在 service 层
    return await this.questionService.getFeaturedQuestions();
  }

  /**
   * 获取问卷预览信息（公开）
   *
   * 前端调用：GET /api/questions/:id/preview
   * 用途：用于“预览/分享页/首页点击查看”，需要返回完整 componentList（题目/组件配置）
   *
   * 公开接口约束：
   * - 只允许访问未删除且已发布的问卷
   * - 如果 id 非法或数据不存在，会抛出 NotFoundException（最终由全局异常过滤器处理）
   */
  @Public()
  @Get('questions/:id/preview')
  async getQuestionPreview(@Param('id') id: string) {
    // 参数名保持与前端路由一致：:id
    return await this.questionService.getQuestionPreview(id);
  }
}
