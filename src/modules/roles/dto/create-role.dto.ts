import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

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
}
