import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ActivityLogsService } from '../../activity-logs/activity-logs.service';
import { StatesDao } from './dao/states.dao';
import { StateMaster } from '../entities/state-master.entity';
import { StateDocument } from '../entities/state-document.entity';
import { CreateStateDto, UpdateStateDto } from '../dto/state.dto';

/** CRUD for insurance state master records, including state-level documents. */
@Injectable()
export class StatesService {
  constructor(
    private readonly dao: StatesDao,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async findAllStates(search?: string, isActive?: boolean): Promise<StateMaster[]> {
    return this.dao.findAll(search, isActive);
  }

  async findOneState(id: string): Promise<StateMaster & { documents: StateDocument[] }> {
    const state = await this.dao.findById(id);
    if (!state) throw new NotFoundException('State not found');
    const documents = await this.dao.findDocumentsByStateId(id);
    return { ...state, documents };
  }

  async createState(dto: CreateStateDto, userId: string): Promise<StateMaster> {
    const exists = await this.dao.findByAbbr(dto.state_abbr);
    if (exists) {
      throw new BadRequestException(`State Abbr ${dto.state_abbr} already exists`);
    }
    if (dto.state_code) {
      const existsCode = await this.dao.findByCode(dto.state_code);
      if (existsCode) {
        throw new BadRequestException(`State Code ${dto.state_code} already exists`);
      }
    }
    const state = this.dao.create({
      stateCode: dto.state_code ?? null,
      stateAbbr: dto.state_abbr,
      name: dto.name,
      notes: dto.notes ?? null,
      isActive: dto.is_active ?? true,
      createdBy: userId,
      updatedBy: userId,
    });
    const saved = await this.dao.save(state);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'create',
      entityType: 'state',
      entityId: saved.id,
      description: `Created state master ${saved.name} (${saved.stateAbbr})`,
    });
    return saved;
  }

  async updateState(id: string, dto: UpdateStateDto, userId: string): Promise<StateMaster> {
    const state = await this.dao.findById(id);
    if (!state) throw new NotFoundException('State not found');

    if (dto.state_abbr !== undefined && dto.state_abbr !== state.stateAbbr) {
      const exists = await this.dao.findByAbbr(dto.state_abbr);
      if (exists) throw new BadRequestException(`State Abbr ${dto.state_abbr} already exists`);
    }
    if (
      dto.state_code !== undefined &&
      dto.state_code !== state.stateCode &&
      dto.state_code !== null
    ) {
      const existsCode = await this.dao.findByCode(dto.state_code);
      if (existsCode) throw new BadRequestException(`State Code ${dto.state_code} already exists`);
    }

    Object.assign(state, {
      stateCode: dto.state_code ?? state.stateCode,
      stateAbbr: dto.state_abbr ?? state.stateAbbr,
      name: dto.name ?? state.name,
      notes: dto.notes ?? state.notes,
      isActive: dto.is_active ?? state.isActive,
      updatedBy: userId,
    });
    const saved = await this.dao.save(state);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'edit',
      entityType: 'state',
      entityId: saved.id,
      description: `Updated state master ${saved.name} (${saved.stateAbbr})`,
    });
    return saved;
  }

  async deleteState(id: string, userId?: string): Promise<void> {
    const state = await this.dao.findById(id);
    if (!state) throw new NotFoundException('State not found');
    await this.dao.delete(id);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'delete',
      entityType: 'state',
      entityId: id,
      description: `Deleted state master ${state.name} (${state.stateAbbr})`,
    });
  }

  async addStateDocument(
    stateId: string,
    fileName: string,
    fileUrl: string,
    documentType: string,
    userId: string,
  ): Promise<StateDocument> {
    const state = await this.dao.findById(stateId);
    if (!state) throw new NotFoundException('State not found');

    const doc = this.dao.createDocument({
      stateId,
      fileName,
      fileUrl,
      documentType,
      uploadedBy: userId,
    });
    return this.dao.saveDocument(doc);
  }

  async findStateDocument(id: string): Promise<StateDocument> {
    const doc = await this.dao.findDocumentById(id);
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async deleteStateDocument(id: string): Promise<void> {
    const doc = await this.dao.findDocumentById(id);
    if (!doc) throw new NotFoundException('Document not found');
    await this.dao.deleteDocument(id);
  }
}
