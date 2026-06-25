import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class RolePermissionDto {
  @ApiProperty({ example: 'billing' })
  @IsString()
  module_id: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  view?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  create?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  edit?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  approve?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  export?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  post?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  file?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  lock?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  override?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  reconcile?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  void?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  reverse?: boolean;
}

export class CreateRoleDto {
  @ApiProperty({ example: 'underwriter' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Underwriter' })
  @IsString()
  label: string;

  @ApiPropertyOptional({ example: '#3B82F6' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color must be a valid hex color (e.g. #3B82F6)' })
  color?: string;

  @ApiPropertyOptional({ example: 'Handles underwriting decisions' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: () => [RolePermissionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RolePermissionDto)
  permissions?: RolePermissionDto[];
}

