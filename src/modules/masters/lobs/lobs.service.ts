import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { LobsDao } from './dao/lobs.dao';
import { LineOfBusiness } from '../entities/line-of-business.entity';
import { CreateLobDto, UpdateLobDto } from '../dto/lob.dto';

/** CRUD for line-of-business master records. */
@Injectable()
export class LobsService {
  constructor(private readonly dao: LobsDao) {}

  async findAllLobs(search?: string, isActive?: boolean): Promise<LineOfBusiness[]> {
    return this.dao.findAll(search, isActive);
  }

  async createLob(dto: CreateLobDto, userId: string): Promise<LineOfBusiness> {
    const exists = await this.dao.findByCode(dto.lob_code);
    if (exists) throw new BadRequestException(`LOB code ${dto.lob_code} already exists`);

    const lob = this.dao.create({
      lobCode: dto.lob_code,
      name: dto.name,
      isActive: dto.is_active ?? true,
      description: dto.description ?? null,
      type: dto.type ?? null,
      taxable: dto.taxable ?? false,
      priority: dto.priority ?? 1,
      fullyEarned: dto.fully_earned ?? false,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.dao.save(lob);
  }

  async updateLob(id: string, dto: UpdateLobDto, userId: string): Promise<LineOfBusiness> {
    const lob = await this.dao.findById(id);
    if (!lob) throw new NotFoundException('LOB not found');

    if (dto.lob_code !== undefined && dto.lob_code !== lob.lobCode) {
      const exists = await this.dao.findByCode(dto.lob_code);
      if (exists) throw new BadRequestException(`LOB code ${dto.lob_code} already exists`);
    }

    Object.assign(lob, {
      lobCode: dto.lob_code ?? lob.lobCode,
      name: dto.name ?? lob.name,
      isActive: dto.is_active ?? lob.isActive,
      description: dto.description ?? lob.description,
      type: dto.type ?? lob.type,
      taxable: dto.taxable ?? lob.taxable,
      priority: dto.priority ?? lob.priority,
      fullyEarned: dto.fully_earned ?? lob.fullyEarned,
      updatedBy: userId,
    });
    return this.dao.save(lob);
  }

  async deleteLob(id: string): Promise<void> {
    const lob = await this.dao.findById(id);
    if (!lob) throw new NotFoundException('LOB not found');
    await this.dao.delete(id);
  }
}
