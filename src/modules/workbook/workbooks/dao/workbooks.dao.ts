import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workbook } from '../../entities/workbook.entity';
import { Treaty } from '../../../masters/entities/treaty.entity';

@Injectable()
export class WorkbooksDao {
  constructor(
    @InjectRepository(Workbook)
    private readonly workbookRepo: Repository<Workbook>,
    @InjectRepository(Treaty)
    private readonly treatyRepo: Repository<Treaty>,
  ) {}

  findAllTreaties(): Promise<Treaty[]> {
    return this.treatyRepo.find({ order: { name: 'ASC' } });
  }

  findTreatyByName(name: string): Promise<Treaty | null> {
    return this.treatyRepo.findOne({ where: { name } });
  }

  createTreaty(data: Partial<Treaty>): Treaty {
    return this.treatyRepo.create(data);
  }

  saveTreaty(treaty: Treaty): Promise<Treaty> {
    return this.treatyRepo.save(treaty);
  }

  findAllWorkbooks(): Promise<Workbook[]> {
    return this.workbookRepo.find({ order: { createdAt: 'DESC' } });
  }

  findWorkbookById(id: number): Promise<Workbook | null> {
    return this.workbookRepo.findOne({
      where: { id },
      relations: { stateExhibits: true, cashSettlement: true },
    });
  }

  saveWorkbook(workbook: Workbook): Promise<Workbook> {
    return this.workbookRepo.save(workbook);
  }

  async deleteWorkbook(id: number): Promise<void> {
    const entity = await this.workbookRepo.findOne({ where: { id } });
    if (!entity) return;
    entity.isDeleted = true;
    entity.deletedAt = new Date();
    await this.workbookRepo.save(entity);
  }

  query<T = unknown>(sql: string, params: unknown[]): Promise<T> {
    return this.workbookRepo.query(sql, params);
  }
}
