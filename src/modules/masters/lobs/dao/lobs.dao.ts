import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { LineOfBusiness } from '../../entities/line-of-business.entity';

@Injectable()
export class LobsDao {
  constructor(
    @InjectRepository(LineOfBusiness)
    private readonly lobRepo: Repository<LineOfBusiness>,
  ) {}

  findAll(search?: string, isActive?: boolean): Promise<LineOfBusiness[]> {
    const where: FindOptionsWhere<LineOfBusiness>[] = [];
    if (search) {
      where.push({ name: ILike(`%${search}%`), ...(isActive !== undefined ? { isActive } : {}) });
      where.push({
        lobCode: ILike(`%${search}%`),
        ...(isActive !== undefined ? { isActive } : {}),
      });
    } else {
      const obj: FindOptionsWhere<LineOfBusiness> = {};
      if (isActive !== undefined) obj.isActive = isActive;
      where.push(obj);
    }
    return this.lobRepo.find({
      where: where.length > 1 ? where : where[0],
      order: { lobCode: 'ASC' },
    });
  }

  findById(id: string): Promise<LineOfBusiness | null> {
    return this.lobRepo.findOne({ where: { id } });
  }

  findByCode(lobCode: string): Promise<LineOfBusiness | null> {
    return this.lobRepo.findOne({ where: { lobCode } });
  }

  create(data: Partial<LineOfBusiness>): LineOfBusiness {
    return this.lobRepo.create(data);
  }

  save(lob: LineOfBusiness): Promise<LineOfBusiness> {
    return this.lobRepo.save(lob);
  }

  async delete(id: string): Promise<void> {
    const entity = await this.lobRepo.findOne({ where: { id } });

    if (!entity) return;

    entity.isDeleted = true;

    entity.deletedAt = new Date();

    await this.lobRepo.save(entity);
  }
}
