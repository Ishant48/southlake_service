import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ActivityLogsService } from '../../activity-logs/activity-logs.service';
import { MastersConfigDao } from './dao/masters-config.dao';
import { LockedPeriod } from '../entities/locked-period.entity';
import { DocumentType } from '../entities/document-type.entity';
import { SequencePrefixMaster } from '../entities/sequence-prefix-counter.entity';
import { TreatyTypeMaster } from '../entities/treaty-type-master.entity';
import { CreateDocumentTypeDto, UpdateDocumentTypeDto } from '../dto/document-type.dto';
import {
  CreateSequencePrefixMasterDto,
  UpdateSequencePrefixMasterDto,
} from '../dto/sequence-prefix-counter.dto';
import { CreateTreatyTypeDto, UpdateTreatyTypeDto } from '../dto/treaty-type.dto';

/** Admin/config concerns for masters: month-end locked periods, document types, and sequence prefix counters. */
@Injectable()
export class MastersConfigService {
  constructor(
    private readonly dao: MastersConfigDao,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  // ==========================================
  // LOCKED PERIODS (MONTH-END CLOSING) OPERATIONS
  // ==========================================
  async findAllLockedPeriods(search?: string): Promise<LockedPeriod[]> {
    return this.dao.findAllLockedPeriods(search);
  }

  async findOneLockedPeriod(id: string): Promise<LockedPeriod> {
    const lp = await this.dao.findLockedPeriodById(id);
    if (!lp) throw new NotFoundException('Locked period record not found');
    return lp;
  }

  async lockPeriod(period: string, userId?: string): Promise<LockedPeriod> {
    let lp = await this.dao.findLockedPeriodByPeriod(period);
    if (lp) {
      lp.isLocked = true;
      lp.lockedBy = userId ?? null;
      await this.dao.saveLockedPeriod(lp);
    } else {
      lp = this.dao.createLockedPeriod({
        period,
        isLocked: true,
        lockedBy: userId ?? null,
      });
      await this.dao.saveLockedPeriod(lp);
    }
    const saved = await this.findOneLockedPeriod(lp.id);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'lock',
      description: `Locked period ${period}`,
    });
    return saved;
  }

  async unlockPeriod(period: string, userId?: string): Promise<LockedPeriod> {
    const lp = await this.dao.findLockedPeriodByPeriod(period);
    if (!lp) throw new NotFoundException(`Period ${period} is not locked`);
    lp.isLocked = false;
    await this.dao.saveLockedPeriod(lp);
    const saved = await this.findOneLockedPeriod(lp.id);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'override',
      description: `Unlocked period ${period}`,
    });
    return saved;
  }

  async isPeriodLocked(period: string): Promise<boolean> {
    const lp = await this.dao.findLockedPeriodByPeriod(period);
    return lp ? lp.isLocked : false;
  }

  // ==========================================
  // DOCUMENT TYPE MASTER OPERATIONS
  // ==========================================
  async findAllDocumentTypes(search?: string, isActive?: boolean): Promise<DocumentType[]> {
    return this.dao.findAllDocumentTypes(search, isActive);
  }

  async findOneDocumentType(id: string): Promise<DocumentType> {
    const docType = await this.dao.findDocumentTypeById(id);
    if (!docType) throw new NotFoundException('Document Type not found');
    return docType;
  }

  async createDocumentType(dto: CreateDocumentTypeDto, userId?: string): Promise<DocumentType> {
    const exists = await this.dao.findDocumentTypeByCode(dto.type_code);
    if (exists) throw new BadRequestException(`Document Type code ${dto.type_code} already exists`);

    const docType = this.dao.createDocumentType({
      typeCode: dto.type_code,
      name: dto.name,
      description: dto.description ?? null,
      isActive: dto.is_active ?? true,
    });
    const saved = await this.dao.saveDocumentType(docType);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'create',
      description: `Created Document Type ${saved.name} (${saved.typeCode})`,
    });
    return saved;
  }

  async updateDocumentType(
    id: string,
    dto: UpdateDocumentTypeDto,
    userId?: string,
  ): Promise<DocumentType> {
    const docType = await this.findOneDocumentType(id);
    if (dto.type_code !== undefined && dto.type_code !== docType.typeCode) {
      const exists = await this.dao.findDocumentTypeByCode(dto.type_code);
      if (exists)
        throw new BadRequestException(`Document Type code ${dto.type_code} already exists`);
    }

    Object.assign(docType, {
      typeCode: dto.type_code ?? docType.typeCode,
      name: dto.name ?? docType.name,
      description: dto.description ?? docType.description,
      isActive: dto.is_active ?? docType.isActive,
    });
    const saved = await this.dao.saveDocumentType(docType);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'edit',
      description: `Updated Document Type ${saved.name} (${saved.typeCode})`,
    });
    return saved;
  }

  async deleteDocumentType(id: string, userId?: string): Promise<void> {
    const docType = await this.findOneDocumentType(id);
    await this.dao.deleteDocumentType(id);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'delete',
      description: `Deleted Document Type ${docType.name} (${docType.typeCode})`,
    });
  }

  // ==========================================
  // SEQUENCE PREFIX & COUNTERS MASTER OPERATIONS
  // ==========================================
  async findAllSequencePrefixCounters(
    search?: string,
    isActive?: boolean,
  ): Promise<SequencePrefixMaster[]> {
    return this.dao.findAllSequencePrefixCounters(search, isActive);
  }

  async findOneSequencePrefixCounter(id: string): Promise<SequencePrefixMaster> {
    const counter = await this.dao.findSequencePrefixCounterById(id);
    if (!counter) throw new NotFoundException('Sequence Prefix & Counter not found');
    return counter;
  }

  async createSequencePrefixCounter(
    dto: CreateSequencePrefixMasterDto,
    userId?: string,
  ): Promise<SequencePrefixMaster> {
    const exists = await this.dao.findSequencePrefixCounterByCode(dto.sequence_type);
    if (exists)
      throw new BadRequestException(`Sequence Counter code ${dto.sequence_type} already exists`);

    const counter = this.dao.createSequencePrefixCounter({
      sequenceType: dto.sequence_type,
      name: dto.name,
      prefix: dto.prefix ?? '',
      prefixConnector: dto.prefix_connector ?? null,
      seqStart: dto.seq_start ?? 1,
      nextNumber: dto.next_number ?? 1,
      suffix: dto.suffix ?? null,
      suffixConnector: dto.suffix_connector ?? null,
      description: dto.description ?? null,
      isActive: dto.is_active ?? true,
    });
    const saved = await this.dao.saveSequencePrefixCounter(counter);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'create',
      description: `Created Sequence Counter ${saved.name} (${saved.sequenceType})`,
    });
    return saved;
  }

  async updateSequencePrefixCounter(
    id: string,
    dto: UpdateSequencePrefixMasterDto,
    userId?: string,
  ): Promise<SequencePrefixMaster> {
    const counter = await this.findOneSequencePrefixCounter(id);
    if (dto.sequence_type !== undefined && dto.sequence_type !== counter.sequenceType) {
      const exists = await this.dao.findSequencePrefixCounterByCode(dto.sequence_type);
      if (exists)
        throw new BadRequestException(`Sequence Counter code ${dto.sequence_type} already exists`);
    }

    Object.assign(counter, {
      sequenceType: dto.sequence_type ?? counter.sequenceType,
      name: dto.name ?? counter.name,
      prefix: dto.prefix ?? counter.prefix,
      prefixConnector: dto.prefix_connector ?? counter.prefixConnector,
      seqStart: dto.seq_start ?? counter.seqStart,
      nextNumber: dto.next_number ?? counter.nextNumber,
      suffix: dto.suffix ?? counter.suffix,
      suffixConnector: dto.suffix_connector ?? counter.suffixConnector,
      description: dto.description ?? counter.description,
      isActive: dto.is_active ?? counter.isActive,
    });
    const saved = await this.dao.saveSequencePrefixCounter(counter);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'edit',
      description: `Updated Sequence Counter ${saved.name} (${saved.sequenceType})`,
    });
    return saved;
  }

  async deleteSequencePrefixCounter(id: string, userId?: string): Promise<void> {
    const counter = await this.findOneSequencePrefixCounter(id);
    await this.dao.deleteSequencePrefixCounter(id);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'delete',
      description: `Deleted Sequence Counter ${counter.name} (${counter.sequenceType})`,
    });
  }

  // ==========================================
  // TREATY TYPE MASTER OPERATIONS
  // ==========================================
  async findAllTreatyTypes(search?: string, isActive?: boolean): Promise<TreatyTypeMaster[]> {
    return this.dao.findAllTreatyTypes(search, isActive);
  }

  async findOneTreatyType(id: string): Promise<TreatyTypeMaster> {
    const treatyType = await this.dao.findTreatyTypeById(id);
    if (!treatyType) throw new NotFoundException('Treaty Type not found');
    return treatyType;
  }

  async createTreatyType(dto: CreateTreatyTypeDto, userId?: string): Promise<TreatyTypeMaster> {
    const exists = await this.dao.findTreatyTypeByCode(dto.type_code);
    if (exists) throw new BadRequestException(`Treaty Type code ${dto.type_code} already exists`);

    const treatyType = this.dao.createTreatyType({
      typeCode: dto.type_code,
      name: dto.name,
      description: dto.description ?? null,
      isActive: dto.is_active ?? true,
    });
    const saved = await this.dao.saveTreatyType(treatyType);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'create',
      description: `Created Treaty Type ${saved.name} (${saved.typeCode})`,
    });
    return saved;
  }

  async updateTreatyType(
    id: string,
    dto: UpdateTreatyTypeDto,
    userId?: string,
  ): Promise<TreatyTypeMaster> {
    const treatyType = await this.findOneTreatyType(id);
    if (dto.type_code !== undefined && dto.type_code !== treatyType.typeCode) {
      const exists = await this.dao.findTreatyTypeByCode(dto.type_code);
      if (exists) throw new BadRequestException(`Treaty Type code ${dto.type_code} already exists`);
    }

    Object.assign(treatyType, {
      typeCode: dto.type_code ?? treatyType.typeCode,
      name: dto.name ?? treatyType.name,
      description: dto.description ?? treatyType.description,
      isActive: dto.is_active ?? treatyType.isActive,
    });
    const saved = await this.dao.saveTreatyType(treatyType);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'edit',
      description: `Updated Treaty Type ${saved.name} (${saved.typeCode})`,
    });
    return saved;
  }

  async deleteTreatyType(id: string, userId?: string): Promise<void> {
    const treatyType = await this.findOneTreatyType(id);
    await this.dao.deleteTreatyType(id);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'delete',
      description: `Deleted Treaty Type ${treatyType.name} (${treatyType.typeCode})`,
    });
  }
}
