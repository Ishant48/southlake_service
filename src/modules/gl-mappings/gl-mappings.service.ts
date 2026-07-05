import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { GlMapping } from './entities/gl-mapping.entity';
import { CreateGlMappingDto, UpdateGlMappingDto } from './dto/gl-mapping.dto';
import { GlMappingsDao } from './dao/gl-mappings.dao';

@Injectable()
export class GlMappingsService {
  constructor(private readonly dao: GlMappingsDao) {}

  async findAll(): Promise<GlMapping[]> {
    return this.dao.findAll();
  }

  async findOne(id: string): Promise<GlMapping> {
    const mapping = await this.dao.findById(id);
    if (!mapping) {
      throw new NotFoundException(`GL Mapping with ID ${id} not found`);
    }
    return mapping;
  }

  async create(dto: CreateGlMappingDto): Promise<GlMapping> {
    // 1. Verify COA exists
    const coa = await this.dao.findCoaById(dto.coa_id);
    if (!coa) {
      throw new BadRequestException(`Chart of Account with ID ${dto.coa_id} does not exist`);
    }

    // 2. Check if mapping type already exists
    const existing = await this.dao.findByType(dto.type);
    if (existing) {
      throw new BadRequestException(`GL Mapping type '${dto.type}' is already configured`);
    }

    const saved = await this.dao.save({
      coaId: dto.coa_id,
      type: dto.type,
    });

    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateGlMappingDto): Promise<GlMapping> {
    const mapping = await this.findOne(id);

    if (dto.coa_id) {
      const coa = await this.dao.findCoaById(dto.coa_id);
      if (!coa) {
        throw new BadRequestException(`Chart of Account with ID ${dto.coa_id} does not exist`);
      }
      mapping.coaId = dto.coa_id;
    }

    if (dto.type && dto.type !== mapping.type) {
      const existing = await this.dao.findByType(dto.type);
      if (existing) {
        throw new BadRequestException(`GL Mapping type '${dto.type}' is already configured`);
      }
      mapping.type = dto.type;
    }

    await this.dao.save(mapping);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const mapping = await this.findOne(id);
    await this.dao.remove(mapping);
  }
}
