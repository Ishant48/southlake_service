import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { TreatyTypeMaster } from '../../entities/treaty-type-master.entity';

@Injectable()
export class TreatyTypesDao {
  constructor(
    @InjectRepository(TreatyTypeMaster)
    private readonly repo: Repository<TreatyTypeMaster>,
  ) {}

  findAll(search?: string, isActive?: boolean): Promise<TreatyTypeMaster[]> {
    const where: FindOptionsWhere<TreatyTypeMaster>[] = [];
    if (search) {
      where.push({
        name: ILike(`%${search}%`),
        isDeleted: false,
        ...(isActive !== undefined ? { isActive } : {}),
      });
      where.push({
        typeCode: ILike(`%${search}%`),
        isDeleted: false,
        ...(isActive !== undefined ? { isActive } : {}),
      });
    } else {
      const obj: FindOptionsWhere<TreatyTypeMaster> = { isDeleted: false };
      if (isActive !== undefined) obj.isActive = isActive;
      where.push(obj);
    }
    return this.repo.find({
      where: where.length > 1 ? where : where[0],
      order: { typeCode: 'ASC' },
    });
  }

  findById(id: string): Promise<TreatyTypeMaster | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByCode(typeCode: string): Promise<TreatyTypeMaster | null> {
    return this.repo.findOne({ where: { typeCode } });
  }

  create(data: Partial<TreatyTypeMaster>): TreatyTypeMaster {
    return this.repo.create(data);
  }

  save(entity: TreatyTypeMaster): Promise<TreatyTypeMaster> {
    return this.repo.save(entity);
  }

  async delete(id: string): Promise<void> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) return;
    entity.isDeleted = true;
    entity.deletedAt = new Date();
    await this.repo.save(entity);
  }
}
