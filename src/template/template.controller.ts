import { Controller, Get, Param, Post, Query, Request } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator'; // 公开路由装饰器，跳过 JWT 校验
import { TemplateService } from './template.service';

/**
 * 用户类型定义（与 auth guard 注入的 user 对齐）
 */
type JwtUser = { username: string };

/**
 * 模板公开接口 + "使用模板"接口
 *
 * 路由前缀：templates
 * 真实路径：/api/templates/...（main.ts 有全局前缀 api）
 *
 * 全局 TransformInterceptor 会统一包装响应为 { errno: 0, data: ... }
 */
@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  // ================================
  // C 端公开接口（无需登录）
  // ================================

  /**
   * 获取公开模板列表
   *
   * GET /api/templates
   * Query: page, pageSize, keyword, category, tag
   *
   * @Public() 跳过登录校验
   */
  @Public() // 无需登录即可访问
  @Get()
  async list(
    @Query('page') page: string = '1', // 页码，默认第 1 页
    @Query('pageSize') pageSize: string = '12', // 每页数量，默认 12 条
    @Query('keyword') keyword?: string, // 关键词搜索（匹配标题/描述）
    @Query('category') category?: string, // 分类筛选
    @Query('tag') tag?: string, // 标签筛选
  ) {
    // Query 参数为 string 类型，需转换为 number 并提供默认值
    return await this.templateService.getPublicTemplateList({
      page: parseInt(page, 10) || 1,
      pageSize: parseInt(pageSize, 10) || 12,
      keyword,
      category,
      tag,
    });
  }

  /**
   * 获取公开模板详情（预览）
   *
   * GET /api/templates/:id
   * 只返回已发布（templateStatus='published'）的模板
   *
   * @Public() 跳过登录校验
   */
  @Public() // 无需登录即可访问
  @Get(':id')
  async detail(@Param('id') id: string) {
    // Service 层会校验 templateStatus === 'published'，否则 404
    return await this.templateService.getPublicTemplateDetail(id);
  }

  // ================================
  // "使用模板"接口（需要登录）
  // ================================

  /**
   * 使用模板创建问卷
   *
   * POST /api/templates/:id/use
   *
   * 行为：
   * 1. 校验模板存在且 templateStatus='published'
   * 2. 克隆模板为新问卷（owner = 当前登录用户）
   * 3. componentList 重新生成 fe_id
   * 4. 返回新问卷 id，前端跳转 B 端编辑页
   *
   * 未加 @Public()，需要有效的 Bearer Token
   */
  @Post(':id/use') // 未加 @Public()，需要有效的 Bearer Token
  async useTemplate(
    @Param('id') id: string, // 模板 MongoDB _id
    @Request() req: { user: JwtUser }, // AuthGuard 注入的用户信息
  ) {
    const { username } = req.user; // 获取当前登录用户名，用作新问卷的 owner
    return await this.templateService.useTemplate(id, username);
  }
}
