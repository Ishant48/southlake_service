import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';

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
}
