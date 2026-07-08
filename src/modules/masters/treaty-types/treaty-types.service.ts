import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { TreatyTypesDao } from './dao/treaty-types.dao';
import { TreatyTypeMaster } from '../entities/treaty-type-master.entity';
import { CreateTreatyTypeDto, UpdateTreatyTypeDto } from '../dto/treaty-type.dto';

@Injectable()
export class TreatyTypesService {
  constructor(private readonly dao: TreatyTypesDao) {}

  async findAllTreatyTypes(search?: string, isActive?: boolean): Promise<TreatyTypeMaster[]> {
    return this.dao.findAll(search, isActive);
  }

  async createTreatyType(dto: CreateTreatyTypeDto, userId: string): Promise<TreatyTypeMaster> {
    const exists = await this.dao.findByCode(dto.type_code);
    if (exists) throw new BadRequestException(`Treaty type code ${dto.type_code} already exists`);

    const entity = this.dao.create({
      typeCode: dto.type_code,
      name: dto.name,
      isActive: dto.is_active ?? true,
      description: dto.description ?? null,
      createdBy: userId,
      updatedBy: userId,
    });
    return this.dao.save(entity);
  }

  async updateTreatyType(id: string, dto: UpdateTreatyTypeDto, userId: string): Promise<TreatyTypeMaster> {
    const entity = await this.dao.findById(id);
    if (!entity) throw new NotFoundException('Treaty type not found');

    if (dto.type_code !== undefined && dto.type_code !== entity.typeCode) {
      const exists = await this.dao.findByCode(dto.type_code);
      if (exists) throw new BadRequestException(`Treaty type code ${dto.type_code} already exists`);
    }

    Object.assign(entity, {
      typeCode: dto.type_code ?? entity.typeCode,
      name: dto.name ?? entity.name,
      isActive: dto.is_active ?? entity.isActive,
      description: dto.description ?? entity.description,
      updatedBy: userId,
    });
    return this.dao.save(entity);
  }

  async deleteTreatyType(id: string): Promise<void> {
    const entity = await this.dao.findById(id);
    if (!entity) throw new NotFoundException('Treaty type not found');
    await this.dao.delete(id);
  }
}
