import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserPermissionsDto } from './dto/update-user-permissions.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { User } from '../../entities/user.entity';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User stats' })
  getStats() {
    return this.service.getStats();
  }

  @Post('deactivate-bulk')
  @ApiOperation({ summary: 'Deactivate multiple users' })
  @ApiResponse({ status: 200, description: 'Users deactivated' })
  deactivateBulk(@Body() body: { ids: string[] }, @CurrentUser() user: User) {
    return this.service.deactivateBulk(body.ids, user);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a new user by email' })
  @ApiResponse({ status: 201, description: 'Invitation sent' })
  invite(@Body() dto: InviteUserDto, @CurrentUser() user: User) {
    return this.service.invite(dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List all users with filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role_id', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'user_type', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'per_page', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Paginated list of users' })
  findAll(
    @Query('search') search?: string,
    @Query('role_id') roleId?: string,
    @Query('status') status?: string,
    @Query('user_type') userType?: string,
    @Query('page') page = '1',
    @Query('per_page') perPage = '20',
  ) {
    return this.service.findAll({
      search,
      roleId,
      status,
      userType,
      page: parseInt(page, 10),
      limit: parseInt(perPage, 10),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID with role and permissions' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id', UuidValidationPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a user' })
  @ApiResponse({ status: 200, description: 'User deactivated' })
  deactivate(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.service.deactivate(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile fields' })
  @ApiResponse({ status: 200, description: 'Updated user' })
  update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: User,
  ) {
    return this.service.update(id, dto, user);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Set user active or inactive' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  updateStatus(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.service.updateStatus(id, dto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  remove(@Param('id', UuidValidationPipe) id: string, @CurrentUser() user: User) {
    return this.service.remove(id, user);
  }

  @Get(':id/permissions')
  @ApiOperation({ summary: 'Get user-level permission overrides' })
  @ApiResponse({ status: 200, description: 'User permissions' })
  getPermissions(@Param('id', UuidValidationPipe) id: string) {
    return this.service.getPermissions(id);
  }

  @Put(':id/permissions')
  @ApiOperation({ summary: 'Replace user permission overrides' })
  @ApiResponse({ status: 200, description: 'Permissions updated' })
  upsertPermissions(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdateUserPermissionsDto,
    @CurrentUser() user: User,
  ) {
    return this.service.upsertPermissions(id, dto.permissions, user);
  }
}
