import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workbook } from '../../entities/workbook.entity';

@Injectable()
export class WorkbookLookupsDao {
  constructor(
    @InjectRepository(Workbook)
    private readonly workbookRepo: Repository<Workbook>,
  ) {}

  findByProgramMonthSource(
    program: string,
    monthKey: string,
    source: string,
  ): Promise<Workbook | null> {
    return this.workbookRepo.findOne({
      where: { program, monthKey, source },
      relations: { stateExhibits: true },
    });
  }

  findLatestByProgramSource(program: string, source: string): Promise<Workbook | null> {
    return this.workbookRepo.findOne({
      where: { program, source },
      relations: { stateExhibits: true },
      order: { createdAt: 'DESC' },
    });
  }

  findLatestByProgramMonth(program: string, monthKey: string): Promise<Workbook | null> {
    return this.workbookRepo.findOne({
      where: { program, monthKey },
      relations: { stateExhibits: true },
      order: { createdAt: 'DESC' },
    });
  }
}
