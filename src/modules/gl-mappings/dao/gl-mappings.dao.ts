import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GlMapping } from '../entities/gl-mapping.entity';
import { ChartOfAccount } from '../../chart-of-accounts/entities/chart-of-account.entity';

@Injectable()
export class GlMappingsDao {
  constructor(
    @InjectRepository(GlMapping)
    private readonly glMappingRepo: Repository<GlMapping>,
    @InjectRepository(ChartOfAccount)
    private readonly coaRepo: Repository<ChartOfAccount>,
  ) {}

  findAll(): Promise<GlMapping[]> {
    return this.glMappingRepo.find({
      relations: ['coa'],
      order: { type: 'ASC' },
    });
  }

  findById(id: string): Promise<GlMapping | null> {
    return this.glMappingRepo.findOne({
      where: { id },
      relations: ['coa'],
    });
  }

  findByType(type: string): Promise<GlMapping | null> {
    return this.glMappingRepo.findOne({ where: { type } });
  }

  save(mapping: Partial<GlMapping>): Promise<GlMapping> {
    return this.glMappingRepo.save(this.glMappingRepo.create(mapping));
  }

  async remove(mapping: GlMapping): Promise<void> {
    mapping.isDeleted = true;
    mapping.deletedAt = new Date();
    await this.glMappingRepo.save(mapping);
  }

  findCoaById(id: string): Promise<ChartOfAccount | null> {
    return this.coaRepo.findOne({ where: { id } });
  }
}
