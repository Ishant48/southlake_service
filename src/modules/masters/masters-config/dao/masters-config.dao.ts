import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { LockedPeriod } from '../../entities/locked-period.entity';
import { DocumentType } from '../../entities/document-type.entity';
import { SequencePrefixCounter } from '../../entities/sequence-prefix-counter.entity';

@Injectable()
export class MastersConfigDao {
  constructor(
    @InjectRepository(LockedPeriod)
    private readonly lockedPeriodRepo: Repository<LockedPeriod>,
    @InjectRepository(DocumentType)
    private readonly documentTypeRepo: Repository<DocumentType>,
    @InjectRepository(SequencePrefixCounter)
    private readonly sequencePrefixCounterRepo: Repository<SequencePrefixCounter>,
  ) {}

  findAllLockedPeriods(search?: string): Promise<LockedPeriod[]> {
    const where: FindOptionsWhere<LockedPeriod> = {};
    if (search) {
      where.period = ILike(`%${search}%`);
    }
    return this.lockedPeriodRepo.find({
      where,
      relations: ['user'],
      order: { period: 'DESC' },
    });
  }

  findLockedPeriodById(id: string): Promise<LockedPeriod | null> {
    return this.lockedPeriodRepo.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  findLockedPeriodByPeriod(period: string): Promise<LockedPeriod | null> {
    return this.lockedPeriodRepo.findOne({ where: { period } });
  }

  createLockedPeriod(data: Partial<LockedPeriod>): LockedPeriod {
    return this.lockedPeriodRepo.create(data);
  }

  saveLockedPeriod(lp: LockedPeriod): Promise<LockedPeriod> {
    return this.lockedPeriodRepo.save(lp);
  }

  findAllDocumentTypes(search?: string, isActive?: boolean): Promise<DocumentType[]> {
    const where: FindOptionsWhere<DocumentType>[] = [];
    if (search) {
      where.push({
        name: ILike(`%${search}%`),
        isDeleted: false,
        ...(isActive !== undefined ? { isActive } : {}),
      });
      where.push({
        code: ILike(`%${search}%`),
        isDeleted: false,
        ...(isActive !== undefined ? { isActive } : {}),
      });
    } else {
      const obj: FindOptionsWhere<DocumentType> = { isDeleted: false };
      if (isActive !== undefined) obj.isActive = isActive;
      where.push(obj);
    }
    return this.documentTypeRepo.find({
      where: where.length > 1 ? where : where[0],
      order: { code: 'ASC' },
    });
  }

  findDocumentTypeById(id: string): Promise<DocumentType | null> {
    return this.documentTypeRepo.findOne({ where: { id } });
  }

  findDocumentTypeByCode(code: string): Promise<DocumentType | null> {
    return this.documentTypeRepo.findOne({ where: { code } });
  }

  createDocumentType(data: Partial<DocumentType>): DocumentType {
    return this.documentTypeRepo.create(data);
  }

  saveDocumentType(docType: DocumentType): Promise<DocumentType> {
    return this.documentTypeRepo.save(docType);
  }

  async deleteDocumentType(id: string): Promise<void> {
    const entity = await this.documentTypeRepo.findOne({ where: { id } });

    if (!entity) return;

    entity.isDeleted = true;

    entity.deletedAt = new Date();

    await this.documentTypeRepo.save(entity);
  }

  findAllSequencePrefixCounters(
    search?: string,
    isActive?: boolean,
  ): Promise<SequencePrefixCounter[]> {
    const where: FindOptionsWhere<SequencePrefixCounter>[] = [];
    if (search) {
      where.push({
        name: ILike(`%${search}%`),
        isDeleted: false,
        ...(isActive !== undefined ? { isActive } : {}),
      });
      where.push({
        code: ILike(`%${search}%`),
        isDeleted: false,
        ...(isActive !== undefined ? { isActive } : {}),
      });
      where.push({
        prefix: ILike(`%${search}%`),
        isDeleted: false,
        ...(isActive !== undefined ? { isActive } : {}),
      });
    } else {
      const obj: FindOptionsWhere<SequencePrefixCounter> = { isDeleted: false };
      if (isActive !== undefined) obj.isActive = isActive;
      where.push(obj);
    }
    return this.sequencePrefixCounterRepo.find({
      where: where.length > 1 ? where : where[0],
      order: { code: 'ASC' },
    });
  }

  findSequencePrefixCounterById(id: string): Promise<SequencePrefixCounter | null> {
    return this.sequencePrefixCounterRepo.findOne({ where: { id } });
  }

  findSequencePrefixCounterByCode(code: string): Promise<SequencePrefixCounter | null> {
    return this.sequencePrefixCounterRepo.findOne({ where: { code } });
  }

  createSequencePrefixCounter(data: Partial<SequencePrefixCounter>): SequencePrefixCounter {
    return this.sequencePrefixCounterRepo.create(data);
  }

  saveSequencePrefixCounter(counter: SequencePrefixCounter): Promise<SequencePrefixCounter> {
    return this.sequencePrefixCounterRepo.save(counter);
  }

  async deleteSequencePrefixCounter(id: string): Promise<void> {
    const entity = await this.sequencePrefixCounterRepo.findOne({ where: { id } });

    if (!entity) return;

    entity.isDeleted = true;

    entity.deletedAt = new Date();

    await this.sequencePrefixCounterRepo.save(entity);
  }
}
