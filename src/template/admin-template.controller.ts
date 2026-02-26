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
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator'; // 权限校验装饰器
import { TemplateService } from './template.service';
import { CreateTemplateDto } from './dto/create-template.dto'; // 创建模板参数验证
import { UpdateTemplateDto } from './dto/update-template.dto'; // 更新模板参数验证

/**
 * 用户类型定义（与 AuthGuard 注入的 user 对象对齐）
 */
type JwtUser = { _id?: string; username: string; role?: string };

/**
 * 管理员模板管理接口
 *
 * 路由前缀：admin/templates
 * 真实路径：/api/admin/templates/...
 *
 * 所有接口都需要 admin 权限（通过 @RequirePermissions 校验）
 */
@Controller('admin/templates')
export class AdminTemplateController {
  constructor(private readonly templateService: TemplateService) {}

  /**
   * 管理员模板列表
   *
   * GET /api/admin/templates
   * 返回 draft + published，支持关键词/状态/分类筛选与分页
   */
  @Get()
  @RequirePermissions('question:read:any') // 需要问卷读取权限
  async list(
    @Query('page') page: string = '1', // 页码，默认第 1 页
    @Query('pageSize') pageSize: string = '10', // 每页数量，默认 10 条
    @Query('keyword') keyword?: string, // 关键词搜索（匹配标题/描述）
    @Query('templateStatus') templateStatus?: string, // 状态筛选：draft / published
    @Query('category') category?: string, // 分类筛选
  ) {
    // 转换 Query 参数类型并传递给 Service
    return await this.templateService.adminListTemplates({
      page: parseInt(page, 10) || 1,
      pageSize: parseInt(pageSize, 10) || 10,
      keyword,
      templateStatus,
      category,
    });
  }

  /**
   * 管理员模板详情
   *
   * GET /api/admin/templates/:id
   * 不受 templateStatus 限制，draft 也可查看（用于编辑）
   */
  @Get(':id')
  @RequirePermissions('question:read:any')
  async detail(@Param('id') id: string) {
    return await this.templateService.adminGetTemplateDetail(id);
  }

  /**
   * 创建空模板
   *
   * POST /api/admin/templates
   * Body: { title, templateDesc?, desc?, js?, css?, cover?, category?, tags?, sort?, componentList? }
   */
  @Post()
  @RequirePermissions('question:update:any') // 需要问卷编辑权限
  async create(
    @Body() dto: CreateTemplateDto, // 经过 class-validator 自动验证
    @Request() req: { user: JwtUser }, // AuthGuard 注入的用户信息
  ) {
    const author = req.user.username; // 当前操作者作为模板 owner
    return await this.templateService.adminCreateTemplate(dto, author);
  }

  /**
   * 从现有问卷保存为模板
   *
   * POST /api/admin/templates/from-question/:questionId
   * 克隆问卷结构为新的模板（templateStatus='draft'）
   */
  @Post('from-question/:questionId')
  @RequirePermissions('question:update:any')
  async createFromQuestion(
    @Param('questionId') questionId: string, // 源问卷 MongoDB _id
    @Request() req: { user: JwtUser },
  ) {
    const author = req.user.username; // 当前操作者作为新模板的 owner
    return await this.templateService.adminCreateFromQuestion(
      questionId,
      author,
    );
  }

  /**
   * 更新模板
   *
   * PATCH /api/admin/templates/:id
   * Body: { title?, templateDesc?, desc?, js?, css?, cover?, category?, tags?, sort?, componentList? }
   */
  @Patch(':id')
  @RequirePermissions('question:update:any')
  async update(
    @Param('id') id: string, // 模板 MongoDB _id
    @Body() dto: UpdateTemplateDto, // 部分更新，只传需要修改的字段
  ) {
    return await this.templateService.adminUpdateTemplate(id, dto);
  }

  /**
   * 发布模板（templateStatus → 'published'）
   *
   * POST /api/admin/templates/:id/publish
   */
  @Post(':id/publish')
  @RequirePermissions('question:update:any')
  async publish(@Param('id') id: string) {
    return await this.templateService.adminPublishTemplate(id);
  }

  /**
   * 下线模板（templateStatus → 'draft'）
   *
   * POST /api/admin/templates/:id/unpublish
   */
  @Post(':id/unpublish')
  @RequirePermissions('question:update:any')
  async unpublish(@Param('id') id: string) {
    return await this.templateService.adminUnpublishTemplate(id);
  }

  /**
   * 删除模板（硬删除）
   *
   * DELETE /api/admin/templates/:id
   */
  @Delete(':id')
  @RequirePermissions('question:update:any')
  async remove(@Param('id') id: string) {
    return await this.templateService.adminDeleteTemplate(id);
  }
}
