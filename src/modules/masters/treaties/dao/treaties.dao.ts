import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Treaty } from '../../entities/treaty.entity';

const TREATY_LIST_RELATIONS = [
  'mga',
  'riskCompany',
  'treatyStates',
  'treatyStates.state',
  'treatyMgas',
  'treatyMgas.mga',
  'treatyReinsurers',
  'treatyReinsurers.reinsurer',
  'treatyCarriers',
  'treatyCarriers.carrier',
  'treatyCarriers.state',
  'treatyProducts',
  'treatyProducts.product',
];

const TREATY_DETAIL_RELATIONS = [
  'mga',
  'riskCompany',
  'treatyStates',
  'treatyStates.state',
  'treatyMgas',
  'treatyMgas.mga',
  'treatyReinsurers',
  'treatyReinsurers.reinsurer',
  'treatyCarriers',
  'treatyCarriers.carrier',
  'treatyCarriers.state',
  'treatyProducts',
  'treatyProducts.product',
];

@Injectable()
export class TreatiesDao {
  constructor(
    @InjectRepository(Treaty)
    private readonly treatyRepo: Repository<Treaty>,
  ) {}

  findAll(search?: string): Promise<Treaty[]> {
    const where: FindOptionsWhere<Treaty>[] = [];
    if (search) {
      where.push({
        name: ILike(`%${search}%`),
        isDeleted: false,
      });
      where.push({
        treatyCode: ILike(`%${search}%`),
        isDeleted: false,
      });
    } else {
      where.push({ isDeleted: false });
    }
    return this.treatyRepo.find({
      where,
      relations: TREATY_LIST_RELATIONS,
      order: { treatyCode: 'ASC' },
    });
  }

  findByIdWithDetails(id: string): Promise<Treaty | null> {
    return this.treatyRepo.findOne({
      where: { id },
      relations: TREATY_DETAIL_RELATIONS,
    });
  }

  findById(id: string): Promise<Treaty | null> {
    return this.treatyRepo.findOne({ where: { id } });
  }

  findByCode(treatyCode: string): Promise<Treaty | null> {
    return this.treatyRepo.findOne({ where: { treatyCode } });
  }

  async delete(id: string): Promise<void> {
    const entity = await this.treatyRepo.findOne({ where: { id } });

    if (!entity) return;

    entity.isDeleted = true;

    entity.deletedAt = new Date();

    await this.treatyRepo.save(entity);
  }
}
