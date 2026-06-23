import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto, AssignEndpointsDto, AssignModulesDto } from './dto';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(id);
  }

  @Post(':id/endpoints')
  async assignEndpoints(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignEndpointsDto,
  ) {
    return this.rolesService.assignEndpoints(id, dto.endpointIds);
  }

  @Post(':id/modules')
  async assignModules(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignModulesDto,
  ) {
    return this.rolesService.assignModules(id, dto.moduleIds);
  }
}
