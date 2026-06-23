import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiEndpointsService } from './api-endpoints.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Api Endpoints')
@ApiBearerAuth()
@Controller('api-endpoints')
export class ApiEndpointsController {
  constructor(private readonly apiEndpointsService: ApiEndpointsService) {}

  @Get()
  @ApiOperation({ summary: 'List all API endpoints' })
  async findAll() {
    return this.apiEndpointsService.findAll();
  }

  @Get('by-module/:id')
  @ApiOperation({ summary: 'Get endpoints by module ID' })
  async findByModule(@Param('id', ParseIntPipe) id: number) {
    return this.apiEndpointsService.findByModuleId(id);
  }
}
