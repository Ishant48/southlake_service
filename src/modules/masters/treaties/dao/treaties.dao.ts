import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Treaty } from '../../entities/treaty.entity';

const TREATY_LIST_RELATIONS = [
  'mga',
  'reinsurer',
  'riskCompany',
  'treatyLobs',
  'treatyLobs.lob',
  'treatyLobs.treatyLobCobs',
  'treatyLobs.treatyLobCobs.cob',
  'treatyStates',
  'treatyStates.state',
  'treatyMgas',
  'treatyMgas.mga',
  'treatyCarriers',
  'treatyCarriers.riskCompany',
  'treatyReinsurers',
  'treatyReinsurers.reinsurer',
];

const TREATY_DETAIL_RELATIONS = [
  'mga',
  'reinsurer',
  'riskCompany',
  'treatyLobs',
  'treatyLobs.lob',
  'treatyLobs.treatyLobCobs',
  'treatyLobs.treatyLobCobs.cob',
  'treatyStates',
  'treatyStates.state',
  'treatyMgas',
  'treatyMgas.mga',
  'treatyCarriers',
  'treatyCarriers.riskCompany',
  'treatyCarriers.state',
  'treatyCarriers.broker',
  'treatyReinsurers',
  'treatyReinsurers.reinsurer',
  'treatyReinsurers.state',
  'treatyReinsurers.broker',
];

@Injectable()
export class TreatiesDao {
  constructor(
    @InjectRepository(Treaty)
    private readonly treatyRepo: Repository<Treaty>,
  ) {}

  findAll(search?: string, isActive?: boolean): Promise<Treaty[]> {
    const where: FindOptionsWhere<Treaty>[] = [];
    if (search) {
      where.push({
        name: ILike(`%${search}%`),
        isDeleted: false,
        ...(isActive !== undefined ? { isActive } : {}),
      });
      where.push({
        treatyCode: ILike(`%${search}%`),
        isDeleted: false,
        ...(isActive !== undefined ? { isActive } : {}),
      });
    } else {
      const obj: FindOptionsWhere<Treaty> = { isDeleted: false };
      if (isActive !== undefined) obj.isActive = isActive;
      where.push(obj);
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
