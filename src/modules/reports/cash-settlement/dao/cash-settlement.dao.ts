import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Treaty } from '../../../masters/entities/treaty.entity';

@Injectable()
export class CashSettlementDao {
  constructor(
    @InjectRepository(Treaty)
    private readonly treatyRepo: Repository<Treaty>,
  ) {}

  findTreatyByProgramWithReinsurer(program: string): Promise<Treaty | null> {
    return this.treatyRepo.findOne({
      where: { name: program },
      relations: { treatyReinsurers: { reinsurer: true } },
    });
  }
}
