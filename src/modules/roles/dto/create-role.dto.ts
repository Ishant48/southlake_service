import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, IsArray, IsUUID } from 'class-validator';

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

  @ApiPropertyOptional({ example: ['uuid-1', 'uuid-2'] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  permissions?: string[];
}
