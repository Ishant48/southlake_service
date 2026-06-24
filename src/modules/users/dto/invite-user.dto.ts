import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

export class InviteUserDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'uuid-of-role' })
  @IsUUID()
  role_id: string;

  @ApiPropertyOptional({ example: 'staff' })
  @IsOptional()
  @IsString()
  user_type?: string;

  @ApiPropertyOptional({ example: 'Finance' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'Analyst' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'mga_user' })
  @IsOptional()
  @IsString()
  user_entity_type?: string;

  @ApiPropertyOptional({ example: 'uuid-of-entity' })
  @IsOptional()
  @IsUUID()
  user_entity_id?: string;
}
