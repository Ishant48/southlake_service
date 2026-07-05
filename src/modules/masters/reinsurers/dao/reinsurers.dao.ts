import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { ReinsurerCompany } from '../../entities/reinsurer-company.entity';

@Injectable()
export class ReinsurersDao {
  constructor(
    @InjectRepository(ReinsurerCompany)
    private readonly reinsurerRepo: Repository<ReinsurerCompany>,
  ) {}

  findAll(search?: string, isActive?: boolean): Promise<ReinsurerCompany[]> {
    const where: FindOptionsWhere<ReinsurerCompany>[] = [];
    if (search) {
      where.push({
        name: ILike(`%${search}%`),
        isDeleted: false,
        ...(isActive !== undefined ? { isActive } : {}),
      });
      where.push({
        reinsurerCompanyId: ILike(`%${search}%`),
        isDeleted: false,
        ...(isActive !== undefined ? { isActive } : {}),
      });
    } else {
      const obj: FindOptionsWhere<ReinsurerCompany> = { isDeleted: false };
      if (isActive !== undefined) obj.isActive = isActive;
      where.push(obj);
    }
    return this.reinsurerRepo.find({
      where: where.length > 1 ? where : where[0],
      order: { reinsurerCompanyId: 'ASC' },
    });
  }

  findById(id: string): Promise<ReinsurerCompany | null> {
    return this.reinsurerRepo.findOne({ where: { id } });
  }

  findByCompanyId(reinsurerCompanyId: string): Promise<ReinsurerCompany | null> {
    return this.reinsurerRepo.findOne({ where: { reinsurerCompanyId } });
  }

  create(data: Partial<ReinsurerCompany>): ReinsurerCompany {
    return this.reinsurerRepo.create(data);
  }

  save(rc: ReinsurerCompany): Promise<ReinsurerCompany> {
    return this.reinsurerRepo.save(rc);
  }

  async delete(id: string): Promise<void> {
    const entity = await this.reinsurerRepo.findOne({ where: { id } });

    if (!entity) return;

    entity.isDeleted = true;

    entity.deletedAt = new Date();

    await this.reinsurerRepo.save(entity);
  }
}
