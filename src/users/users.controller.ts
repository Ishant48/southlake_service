import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateStatusDto,
  AssignEndpointsDto,
  AssignModulesDto,
} from './dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.usersService.updateStatus(id, dto);
  }

  @Post(':id/endpoints')
  async assignEndpoints(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignEndpointsDto,
  ) {
    return this.usersService.assignEndpoints(id, dto.endpointIds);
  }

  @Post(':id/modules')
  async assignModules(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignModulesDto,
  ) {
    return this.usersService.assignModules(id, dto.moduleIds);
  }
}
