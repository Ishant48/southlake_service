import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesService, UpsertRolePermissionEntry } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermission } from '../../common/decorators/require-permission.decorator';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { User } from '../users/entities/user.entity';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Get()
  @RequirePermission('role.manage')
  @ApiOperation({ summary: 'List roles with user counts (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated roles' })
  findAll(@Query('page') page = '1', @Query('per_page') perPage = '20') {
    return this.service.findAll(parseInt(page, 10), parseInt(perPage, 10));
  }

  @Post()
  @RequirePermission('role.manage')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created' })
  create(@Body() dto: CreateRoleDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get(':id')
  @RequirePermission('role.manage')
  @ApiOperation({ summary: 'Get a role by ID with permissions' })
  @ApiResponse({ status: 200, description: 'Role details' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  findOne(@Param('id', UuidValidationPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @RequirePermission('role.manage')
  @ApiOperation({ summary: 'Update an existing role' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser() user: User,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @RequirePermission('role.manage')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiResponse({ status: 200, description: 'Role deleted' })
  remove(@Param('id', UuidValidationPipe) id: string, @CurrentUser() user: User) {
    return this.service.remove(id, user);
  }

  @Get(':id/permissions')
  @RequirePermission('role.manage')
  @ApiOperation({ summary: 'Get permissions for a role' })
  @ApiResponse({ status: 200, description: 'Role permissions' })
  getPermissions(@Param('id', UuidValidationPipe) id: string) {
    return this.service.getPermissions(id);
  }

  @Put(':id/permissions')
  @RequirePermission('role.manage')
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
