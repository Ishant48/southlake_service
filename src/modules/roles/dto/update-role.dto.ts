import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RolePermissionDto } from './create-role.dto';

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Underwriter' })
  @IsOptional()
  @IsString()
  label?: string;

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

