import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RolePermissionDto } from '../../roles/dto/create-role.dto';

export class UpdateUserPermissionsDto {
  @ApiProperty({ type: () => [RolePermissionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RolePermissionDto)
  permissions: RolePermissionDto[];
}
