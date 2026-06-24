import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RolesService, UpsertRolePermissionEntry } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { User } from '../../entities/user.entity';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'List all roles' })
  @ApiResponse({ status: 200, description: 'All roles' })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created' })
  create(@Body() dto: CreateRoleDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing role' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: User,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role (fails if users are assigned)' })
  @ApiResponse({ status: 200, description: 'Role deleted' })
  @ApiResponse({ status: 400, description: 'Users still assigned to role' })
  remove(@Param('id', UuidValidationPipe) id: string, @CurrentUser() user: User) {
    return this.service.remove(id, user);
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: 'Get permissions for a role' })
  @ApiResponse({ status: 200, description: 'Role permissions' })
  getPermissions(@Param('id', UuidValidationPipe) id: string) {
    return this.service.getPermissions(id);
  }

  @Put(':id/permissions')
  @ApiOperation({ summary: 'Replace all permissions for a role' })
  @ApiResponse({ status: 200, description: 'Permissions updated' })
  upsertPermissions(
    @Param('id', UuidValidationPipe) id: string,
    @Body() permissions: UpsertRolePermissionEntry[],
    @CurrentUser() user: User,
  ) {
    return this.service.upsertPermissions(id, permissions, user);
  }
}
