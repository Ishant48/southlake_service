import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CobsDao } from './dao/cobs.dao';
import { CobMaster } from '../entities/cob-master.entity';
import { CreateCobDto, UpdateCobDto } from '../dto/cob.dto';

/** CRUD for class-of-business master records. */
@Injectable()
export class CobsService {
  constructor(private readonly dao: CobsDao) {}

  async findAllCobs(search?: string, isActive?: boolean): Promise<CobMaster[]> {
    return this.dao.findAll(search, isActive);
  }

  async createCob(dto: CreateCobDto, userId: string): Promise<CobMaster> {
    const exists = await this.dao.findByCode(dto.cob_code);
    if (exists) throw new BadRequestException(`COB code ${dto.cob_code} already exists`);

    const cob = this.dao.create({
      cobCode: dto.cob_code,
      name: dto.name,
      isActive: dto.is_active ?? true,
      description: dto.description ?? null,
      type: dto.type ?? null,
      taxable: dto.taxable ?? false,
      priority: dto.priority ?? 1,
      fullyEarned: dto.fully_earned ?? false,
      aslCode: dto.asl_code ?? null,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.dao.save(cob);
  }

  async updateCob(id: string, dto: UpdateCobDto, userId: string): Promise<CobMaster> {
    const cob = await this.dao.findById(id);
    if (!cob) throw new NotFoundException('COB not found');

    if (dto.cob_code !== undefined && dto.cob_code !== cob.cobCode) {
      const exists = await this.dao.findByCode(dto.cob_code);
      if (exists) throw new BadRequestException(`COB code ${dto.cob_code} already exists`);
    }

    Object.assign(cob, {
      cobCode: dto.cob_code ?? cob.cobCode,
      name: dto.name ?? cob.name,
      isActive: dto.is_active ?? cob.isActive,
      description: dto.description ?? cob.description,
      type: dto.type ?? cob.type,
      taxable: dto.taxable ?? cob.taxable,
      priority: dto.priority ?? cob.priority,
      fullyEarned: dto.fully_earned ?? cob.fullyEarned,
      aslCode: dto.asl_code ?? cob.aslCode,
      updatedBy: userId,
    });
    return this.dao.save(cob);
  }

  async deleteCob(id: string): Promise<void> {
    const cob = await this.dao.findById(id);
    if (!cob) throw new NotFoundException('COB not found');
    await this.dao.delete(id);
  }
}
