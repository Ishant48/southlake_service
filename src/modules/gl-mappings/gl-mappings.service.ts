import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GlMapping } from '../../entities/gl-mapping.entity';
import { ChartOfAccount } from '../../entities/chart-of-account.entity';
import { CreateGlMappingDto, UpdateGlMappingDto } from './dto/gl-mapping.dto';

@Injectable()
export class GlMappingsService {
  constructor(
    @InjectRepository(GlMapping)
    private readonly glMappingRepo: Repository<GlMapping>,
    @InjectRepository(ChartOfAccount)
    private readonly coaRepo: Repository<ChartOfAccount>,
  ) {}

  async findAll(): Promise<GlMapping[]> {
    return this.glMappingRepo.find({
      relations: ['coa'],
      order: { type: 'ASC' },
    });
  }

  async findOne(id: string): Promise<GlMapping> {
    const mapping = await this.glMappingRepo.findOne({
      where: { id },
      relations: ['coa'],
    });
    if (!mapping) {
      throw new NotFoundException(`GL Mapping with ID ${id} not found`);
    }
    return mapping;
  }

  async create(dto: CreateGlMappingDto): Promise<GlMapping> {
    // 1. Verify COA exists
    const coa = await this.coaRepo.findOne({ where: { id: dto.coa_id } });
    if (!coa) {
      throw new BadRequestException(`Chart of Account with ID ${dto.coa_id} does not exist`);
    }

    // 2. Check if mapping type already exists
    const existing = await this.glMappingRepo.findOne({ where: { type: dto.type } });
    if (existing) {
      throw new BadRequestException(`GL Mapping type '${dto.type}' is already configured`);
    }

    const mapping = this.glMappingRepo.create({
      coaId: dto.coa_id,
      type: dto.type,
    });

    const saved = await this.glMappingRepo.save(mapping);
    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateGlMappingDto): Promise<GlMapping> {
    const mapping = await this.findOne(id);

    if (dto.coa_id) {
      const coa = await this.coaRepo.findOne({ where: { id: dto.coa_id } });
      if (!coa) {
        throw new BadRequestException(`Chart of Account with ID ${dto.coa_id} does not exist`);
      }
      mapping.coaId = dto.coa_id;
    }

    if (dto.type && dto.type !== mapping.type) {
      const existing = await this.glMappingRepo.findOne({ where: { type: dto.type } });
      if (existing) {
        throw new BadRequestException(`GL Mapping type '${dto.type}' is already configured`);
      }
      mapping.type = dto.type;
    }

    await this.glMappingRepo.save(mapping);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const mapping = await this.findOne(id);
    await this.glMappingRepo.remove(mapping);
  }
}
