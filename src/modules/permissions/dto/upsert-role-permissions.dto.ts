import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpsertRolePermissionItemDto {
  @ApiProperty({ example: 'billing' })
  @IsString()
  moduleId: string;

  @ApiPropertyOptional({ example: 'billing.invoices' })
  @IsOptional()
  @IsString()
  submoduleId?: string;

  @ApiProperty({ example: 'uuid-of-permission' })
  @IsUUID()
  permissionId: string;
}
