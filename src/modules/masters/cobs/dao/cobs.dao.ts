import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { CobMaster } from '../../entities/cob-master.entity';

@Injectable()
export class CobsDao {
  constructor(
    @InjectRepository(CobMaster)
    private readonly cobRepo: Repository<CobMaster>,
  ) {}

  findAll(search?: string, isActive?: boolean): Promise<CobMaster[]> {
    const where: FindOptionsWhere<CobMaster>[] = [];
    if (search) {
      where.push({
        name: ILike(`%${search}%`),
        isDeleted: false,
        ...(isActive !== undefined ? { isActive } : {}),
      });
      where.push({
        cobCode: ILike(`%${search}%`),
        isDeleted: false,
        ...(isActive !== undefined ? { isActive } : {}),
      });
    } else {
      const obj: FindOptionsWhere<CobMaster> = { isDeleted: false };
      if (isActive !== undefined) obj.isActive = isActive;
      where.push(obj);
    }
    return this.cobRepo.find({
      where: where.length > 1 ? where : where[0],
      order: { cobCode: 'ASC' },
    });
  }

  findById(id: string): Promise<CobMaster | null> {
    return this.cobRepo.findOne({ where: { id } });
  }

  findByCode(cobCode: string): Promise<CobMaster | null> {
    return this.cobRepo.findOne({ where: { cobCode } });
  }

  create(data: Partial<CobMaster>): CobMaster {
    return this.cobRepo.create(data);
  }

  save(cob: CobMaster): Promise<CobMaster> {
    return this.cobRepo.save(cob);
  }

  async delete(id: string): Promise<void> {
    const entity = await this.cobRepo.findOne({ where: { id } });

    if (!entity) return;

    entity.isDeleted = true;

    entity.deletedAt = new Date();

    await this.cobRepo.save(entity);
  }
}
