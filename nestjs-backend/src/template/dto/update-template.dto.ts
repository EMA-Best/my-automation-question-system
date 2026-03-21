import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 组件信息 DTO（用于模板 componentList 验证）
 *
 * 对应前端编辑器中的单个组件配置。
 */
class ComponentInfoDto {
  @IsString()
  fe_id: string; // 前端组件唯一标识

  @IsString()
  type: string; // 组件类型

  @IsString()
  title: string; // 组件标题

  @IsOptional()
  isHidden?: boolean; // 是否隐藏

  @IsOptional()
  isLocked?: boolean; // 是否锁定

  @IsOptional()
  props?: Record<string, unknown>; // 组件自定义属性
}

/**
 * 更新模板 DTO
 *
 * 管理员编辑模板时使用，所有字段可选（支持部分更新）。
 * 只传需要修改的字段即可，未传的字段不会被覆盖。
 *
 * 对应接口：PATCH /api/admin/templates/:id
 */
export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  title?: string; // 模板标题

  @IsOptional()
  @IsString()
  templateDesc?: string; // C 端卡片展示用的模板描述

  @IsOptional()
  @IsString()
  js?: string; // 自定义 JavaScript

  @IsOptional()
  @IsString()
  css?: string; // 自定义 CSS

  @IsOptional()
  @IsNumber()
  sort?: number; // 排序权重

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponentInfoDto)
  componentList?: ComponentInfoDto[]; // 组件列表
}
