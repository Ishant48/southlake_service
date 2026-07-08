import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly service: PermissionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all permission actions' })
  @ApiResponse({ status: 200, description: 'All permissions' })
  findAll() {
    return this.service.findAll();
  }

  @Get('modules')
  @ApiOperation({ summary: 'List all modules with their submodules' })
  @ApiResponse({ status: 200, description: 'All modules with submodules' })
  findModules() {
    return this.service.findAllModules();
  }

  @Get('my-modules')
  @ApiOperation({
    summary: 'Navigation tree of modules the current user can access, for a dynamic sidebar',
  })
  @ApiResponse({ status: 200, description: 'Permission-filtered navigation tree' })
  getMyModules(@CurrentUser() user: User) {
    return this.service.getMyModules(user);
  }
}
