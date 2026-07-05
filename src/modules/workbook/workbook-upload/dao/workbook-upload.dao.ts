import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workbook } from '../../entities/workbook.entity';
import { StateExhibit } from '../../entities/state-exhibit.entity';
import { Treaty } from '../../../masters/entities/treaty.entity';

@Injectable()
export class WorkbookUploadDao {
  constructor(
    @InjectRepository(Workbook)
    private readonly workbookRepo: Repository<Workbook>,
    @InjectRepository(StateExhibit)
    private readonly stateExhibitRepo: Repository<StateExhibit>,
    @InjectRepository(Treaty)
    private readonly treatyRepo: Repository<Treaty>,
  ) {}

  findWorkbookWithExhibits(
    program: string,
    monthKey: string,
    source: string,
  ): Promise<Workbook | null> {
    return this.workbookRepo.findOne({
      where: { program, monthKey, source },
      relations: { stateExhibits: true },
    });
  }

  createWorkbook(data: Partial<Workbook>): Workbook {
    return this.workbookRepo.create(data);
  }

  saveWorkbook(workbook: Workbook): Promise<Workbook> {
    return this.workbookRepo.save(workbook);
  }

  findTreatyByName(name: string): Promise<Treaty | null> {
    return this.treatyRepo.findOne({ where: { name } });
  }

  createExhibit(data: Partial<StateExhibit>): StateExhibit {
    return this.stateExhibitRepo.create(data);
  }

  saveExhibits(exhibits: StateExhibit[]): Promise<StateExhibit[]> {
    return this.stateExhibitRepo.save(exhibits);
  }
}
