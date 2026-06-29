import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GlMappingsService } from './gl-mappings.service';
import { CreateGlMappingDto, UpdateGlMappingDto } from './dto/gl-mapping.dto';
import { GlMapping } from '../../entities/gl-mapping.entity';

@ApiTags('GL Mappings')
@ApiBearerAuth()
@Controller('gl-mappings')
export class GlMappingsController {
  constructor(private readonly glMappingsService: GlMappingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all GL mappings' })
  @ApiResponse({ status: 200, description: 'Return all GL mappings.' })
  async findAll(): Promise<GlMapping[]> {
    return this.glMappingsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a GL mapping by ID' })
  @ApiResponse({ status: 200, description: 'Return the GL mapping.' })
  @ApiResponse({ status: 404, description: 'GL Mapping not found.' })
  async findOne(@Param('id') id: string): Promise<GlMapping> {
    return this.glMappingsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new GL mapping' })
  @ApiResponse({ status: 201, description: 'The GL mapping has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input or duplicate mapping type.' })
  async create(@Body() dto: CreateGlMappingDto): Promise<GlMapping> {
    return this.glMappingsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a GL mapping' })
  @ApiResponse({ status: 200, description: 'The GL mapping has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'GL Mapping not found.' })
  @ApiResponse({ status: 400, description: 'Invalid input or duplicate mapping type.' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGlMappingDto,
  ): Promise<GlMapping> {
    return this.glMappingsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a GL mapping' })
  @ApiResponse({ status: 200, description: 'The GL mapping has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'GL Mapping not found.' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.glMappingsService.remove(id);
  }
}
