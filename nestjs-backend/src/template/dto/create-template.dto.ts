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
 * 对应前端编辑器中的单个组件配置，
 * 包含组件类型、标题、属性、显示/锁定状态等。
 */
class ComponentInfoDto {
  @IsString()
  fe_id: string; // 前端组件唯一标识

  @IsString()
  type: string; // 组件类型，如 questionInput、questionRadio 等

  @IsString()
  title: string; // 组件标题（题目文本）

  @IsOptional()
  isHidden?: boolean; // 是否隐藏（隐藏的组件不计入题目数）

  @IsOptional()
  isLocked?: boolean; // 是否锁定（锁定后不可编辑）

  @IsOptional()
  props?: Record<string, unknown>; // 组件自定义属性（如选项列表、placeholder 等）
}

/**
 * 创建模板 DTO
 *
 * 管理员创建空模板时使用，title 必填，其余字段均可选。
 * 如果不传 componentList，后端会自动创建一个 questionInfo 组件作为初始内容。
 *
 * 对应接口：POST /api/admin/templates
 */
export class CreateTemplateDto {
  @IsString()
  title: string; // 模板标题（必填）

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
  sort?: number; // 排序权重（越大越靠前）

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ComponentInfoDto)
  componentList?: ComponentInfoDto[]; // 组件列表（可选，不传则自动创建默认组件）
}
