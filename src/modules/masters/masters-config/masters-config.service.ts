import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ActivityLogsService } from '../../activity-logs/activity-logs.service';
import { MastersConfigDao } from './dao/masters-config.dao';
import { LockedPeriod } from '../entities/locked-period.entity';
import { DocumentType } from '../entities/document-type.entity';
import { SequencePrefixCounter } from '../entities/sequence-prefix-counter.entity';
import { CreateDocumentTypeDto, UpdateDocumentTypeDto } from '../dto/document-type.dto';
import {
  CreateSequencePrefixCounterDto,
  UpdateSequencePrefixCounterDto,
} from '../dto/sequence-prefix-counter.dto';

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
      entityType: 'locked_period',
      entityId: saved.id,
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
      entityType: 'locked_period',
      entityId: saved.id,
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
    const exists = await this.dao.findDocumentTypeByCode(dto.code);
    if (exists) throw new BadRequestException(`Document Type code ${dto.code} already exists`);

    const docType = this.dao.createDocumentType({
      code: dto.code,
      name: dto.name,
      description: dto.description ?? null,
      isActive: dto.is_active ?? true,
    });
    const saved = await this.dao.saveDocumentType(docType);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'create',
      entityType: 'document_type',
      entityId: saved.id,
      description: `Created Document Type ${saved.name} (${saved.code})`,
    });
    return saved;
  }

  async updateDocumentType(
    id: string,
    dto: UpdateDocumentTypeDto,
    userId?: string,
  ): Promise<DocumentType> {
    const docType = await this.findOneDocumentType(id);
    if (dto.code !== undefined && dto.code !== docType.code) {
      const exists = await this.dao.findDocumentTypeByCode(dto.code);
      if (exists) throw new BadRequestException(`Document Type code ${dto.code} already exists`);
    }

    Object.assign(docType, {
      code: dto.code ?? docType.code,
      name: dto.name ?? docType.name,
      description: dto.description ?? docType.description,
      isActive: dto.is_active ?? docType.isActive,
    });
    const saved = await this.dao.saveDocumentType(docType);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'edit',
      entityType: 'document_type',
      entityId: saved.id,
      description: `Updated Document Type ${saved.name} (${saved.code})`,
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
      entityType: 'document_type',
      entityId: id,
      description: `Deleted Document Type ${docType.name} (${docType.code})`,
    });
  }

  // ==========================================
  // SEQUENCE PREFIX & COUNTERS MASTER OPERATIONS
  // ==========================================
  async findAllSequencePrefixCounters(
    search?: string,
    isActive?: boolean,
  ): Promise<SequencePrefixCounter[]> {
    return this.dao.findAllSequencePrefixCounters(search, isActive);
  }

  async findOneSequencePrefixCounter(id: string): Promise<SequencePrefixCounter> {
    const counter = await this.dao.findSequencePrefixCounterById(id);
    if (!counter) throw new NotFoundException('Sequence Prefix & Counter not found');
    return counter;
  }

  async createSequencePrefixCounter(
    dto: CreateSequencePrefixCounterDto,
    userId?: string,
  ): Promise<SequencePrefixCounter> {
    const exists = await this.dao.findSequencePrefixCounterByCode(dto.code);
    if (exists) throw new BadRequestException(`Sequence Counter code ${dto.code} already exists`);

    const counter = this.dao.createSequencePrefixCounter({
      code: dto.code,
      name: dto.name,
      prefix: dto.prefix ?? null,
      nextValue: dto.next_value ?? 1,
      paddingWidth: dto.padding_width ?? 4,
      description: dto.description ?? null,
      isActive: dto.is_active ?? true,
    });
    const saved = await this.dao.saveSequencePrefixCounter(counter);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'create',
      entityType: 'sequence_prefix_counter',
      entityId: saved.id,
      description: `Created Sequence Counter ${saved.name} (${saved.code})`,
    });
    return saved;
  }

  async updateSequencePrefixCounter(
    id: string,
    dto: UpdateSequencePrefixCounterDto,
    userId?: string,
  ): Promise<SequencePrefixCounter> {
    const counter = await this.findOneSequencePrefixCounter(id);
    if (dto.code !== undefined && dto.code !== counter.code) {
      const exists = await this.dao.findSequencePrefixCounterByCode(dto.code);
      if (exists) throw new BadRequestException(`Sequence Counter code ${dto.code} already exists`);
    }

    Object.assign(counter, {
      code: dto.code ?? counter.code,
      name: dto.name ?? counter.name,
      prefix: dto.prefix ?? counter.prefix,
      nextValue: dto.next_value ?? counter.nextValue,
      paddingWidth: dto.padding_width ?? counter.paddingWidth,
      description: dto.description ?? counter.description,
      isActive: dto.is_active ?? counter.isActive,
    });
    const saved = await this.dao.saveSequencePrefixCounter(counter);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'edit',
      entityType: 'sequence_prefix_counter',
      entityId: saved.id,
      description: `Updated Sequence Counter ${saved.name} (${saved.code})`,
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
      entityType: 'sequence_prefix_counter',
      entityId: id,
      description: `Deleted Sequence Counter ${counter.name} (${counter.code})`,
    });
  }
}
