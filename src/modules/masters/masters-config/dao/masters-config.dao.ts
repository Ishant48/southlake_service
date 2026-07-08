import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { LockedPeriod } from '../../entities/locked-period.entity';
import { DocumentType } from '../../entities/document-type.entity';
import { SequencePrefixMaster } from '../../entities/sequence-prefix-counter.entity';
import { TreatyTypeMaster } from '../../entities/treaty-type-master.entity';

@Injectable()
export class MastersConfigDao {
  constructor(
    @InjectRepository(LockedPeriod)
    private readonly lockedPeriodRepo: Repository<LockedPeriod>,
    @InjectRepository(DocumentType)
    private readonly documentTypeRepo: Repository<DocumentType>,
    @InjectRepository(SequencePrefixMaster)
    private readonly sequencePrefixCounterRepo: Repository<SequencePrefixMaster>,
    @InjectRepository(TreatyTypeMaster)
    private readonly treatyTypeRepo: Repository<TreatyTypeMaster>,
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
        typeCode: ILike(`%${search}%`),
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
      order: { typeCode: 'ASC' },
    });
  }

  findDocumentTypeById(id: string): Promise<DocumentType | null> {
    return this.documentTypeRepo.findOne({ where: { id } });
  }

  findDocumentTypeByCode(code: string): Promise<DocumentType | null> {
    return this.documentTypeRepo.findOne({ where: { typeCode: code } });
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
  ): Promise<SequencePrefixMaster[]> {
    const where: FindOptionsWhere<SequencePrefixMaster>[] = [];
    if (search) {
      where.push({
        name: ILike(`%${search}%`),
        isDeleted: false,
        ...(isActive !== undefined ? { isActive } : {}),
      });
      where.push({
        sequenceType: ILike(`%${search}%`),
        isDeleted: false,
        ...(isActive !== undefined ? { isActive } : {}),
      });
      where.push({
        prefix: ILike(`%${search}%`),
        isDeleted: false,
        ...(isActive !== undefined ? { isActive } : {}),
      });
    } else {
      const obj: FindOptionsWhere<SequencePrefixMaster> = { isDeleted: false };
      if (isActive !== undefined) obj.isActive = isActive;
      where.push(obj);
    }
    return this.sequencePrefixCounterRepo.find({
      where: where.length > 1 ? where : where[0],
      order: { sequenceType: 'ASC' },
    });
  }

  findSequencePrefixCounterById(id: string): Promise<SequencePrefixMaster | null> {
    return this.sequencePrefixCounterRepo.findOne({ where: { id } });
  }

  findSequencePrefixCounterByCode(code: string): Promise<SequencePrefixMaster | null> {
    return this.sequencePrefixCounterRepo.findOne({ where: { sequenceType: code } });
  }

  createSequencePrefixCounter(data: Partial<SequencePrefixMaster>): SequencePrefixMaster {
    return this.sequencePrefixCounterRepo.create(data);
  }

  saveSequencePrefixCounter(counter: SequencePrefixMaster): Promise<SequencePrefixMaster> {
    return this.sequencePrefixCounterRepo.save(counter);
  }

  async deleteSequencePrefixCounter(id: string): Promise<void> {
    const entity = await this.sequencePrefixCounterRepo.findOne({ where: { id } });

    if (!entity) return;

    entity.isDeleted = true;

    entity.deletedAt = new Date();

    await this.sequencePrefixCounterRepo.save(entity);
  }

  findAllTreatyTypes(search?: string, isActive?: boolean): Promise<TreatyTypeMaster[]> {
    const where: FindOptionsWhere<TreatyTypeMaster>[] = [];
    if (search) {
      where.push({
        name: ILike(`%${search}%`),
        isDeleted: false,
        ...(isActive !== undefined ? { isActive } : {}),
      });
      where.push({
        typeCode: ILike(`%${search}%`),
        isDeleted: false,
        ...(isActive !== undefined ? { isActive } : {}),
      });
    } else {
      const obj: FindOptionsWhere<TreatyTypeMaster> = { isDeleted: false };
      if (isActive !== undefined) obj.isActive = isActive;
      where.push(obj);
    }
    return this.treatyTypeRepo.find({
      where: where.length > 1 ? where : where[0],
      order: { typeCode: 'ASC' },
    });
  }

  findTreatyTypeById(id: string): Promise<TreatyTypeMaster | null> {
    return this.treatyTypeRepo.findOne({ where: { id } });
  }

  findTreatyTypeByCode(code: string): Promise<TreatyTypeMaster | null> {
    return this.treatyTypeRepo.findOne({ where: { typeCode: code } });
  }

  createTreatyType(data: Partial<TreatyTypeMaster>): TreatyTypeMaster {
    return this.treatyTypeRepo.create(data);
  }

  saveTreatyType(treatyType: TreatyTypeMaster): Promise<TreatyTypeMaster> {
    return this.treatyTypeRepo.save(treatyType);
  }

  async deleteTreatyType(id: string): Promise<void> {
    const entity = await this.treatyTypeRepo.findOne({ where: { id } });

    if (!entity) return;

    entity.isDeleted = true;

    entity.deletedAt = new Date();

    await this.treatyTypeRepo.save(entity);
  }
}
