import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { ChartOfAccount } from '../../entities/chart-of-account.entity';
import { ChartOfAccountDocument } from '../../entities/chart-of-account-document.entity';
import { CreateChartOfAccountDto } from './dto/create-chart-of-account.dto';
import { UpdateChartOfAccountDto } from './dto/update-chart-of-account.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class ChartOfAccountsService {
  constructor(
    @InjectRepository(ChartOfAccount)
    private readonly coaRepo: Repository<ChartOfAccount>,
    @InjectRepository(ChartOfAccountDocument)
    private readonly docRepo: Repository<ChartOfAccountDocument>,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async findAll(search?: string, isActive?: boolean): Promise<ChartOfAccount[]> {
    const where: any = {};
    if (search) {
      if (!isNaN(Number(search))) {
        where.accountCode = Number(search);
      } else {
        where.description = ILike(`%${search}%`);
      }
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.coaRepo.find({
      where,
      order: { accountCode: 'ASC' },
      relations: ['parent', 'earningAccount'],
    });
  }

  async findOne(id: string): Promise<ChartOfAccount & { documents: ChartOfAccountDocument[] }> {
    const coa = await this.coaRepo.findOne({
      where: { id },
      relations: ['parent', 'earningAccount'],
    });

    if (!coa) {
      throw new NotFoundException(`Chart of Account with ID ${id} not found`);
    }

    const documents = await this.docRepo.find({
      where: { coaId: id },
      order: { uploadedAt: 'DESC' },
    });

    return { ...coa, documents };
  }

  async create(dto: CreateChartOfAccountDto, userId: string): Promise<ChartOfAccount> {
    const accountCode = dto.account_code;
    const parentId = dto.parent_id;
    const isParent = dto.is_parent;
    const normalBalance = dto.normal_balance;
    const nextNumber = dto.next_number;
    const earningAccountId = dto.earning_account_id;

    // Check if code is unique
    const codeExists = await this.coaRepo.findOne({ where: { accountCode } });
    if (codeExists) {
      throw new BadRequestException(`Account Code ${accountCode} already exists`);
    }

    // Check if key is unique if specified
    if (dto.key) {
      const keyExists = await this.coaRepo.findOne({ where: { key: dto.key } });
      if (keyExists) {
        throw new BadRequestException(`Account Key '${dto.key}' already exists`);
      }
    }

    let parent: ChartOfAccount | null = null;
    if (parentId) {
      parent = await this.coaRepo.findOne({ where: { id: parentId } });
      if (!parent) {
        throw new NotFoundException(`Parent account not found`);
      }
      if (!parent.isParent) {
        throw new BadRequestException(`Parent account must have is_parent = true`);
      }
    }

    let earningAccount: ChartOfAccount | null = null;
    if (earningAccountId) {
      earningAccount = await this.coaRepo.findOne({ where: { id: earningAccountId } });
      if (!earningAccount) {
        throw new NotFoundException(`Earning account not found`);
      }
    }

    const coa = this.coaRepo.create({
      accountCode,
      key: dto.key,
      description: dto.description,
      parentId,
      isParent: isParent ?? false,
      normalBalance,
      nextNumber,
      earningAccountId,
      notes: dto.notes,
      createdBy: userId,
      updatedBy: userId,
    });

    const saved = await this.coaRepo.save(coa);

    // If parent exists and nextNumber needs tracking
    if (parent) {
      // Suggest next number by incrementing parent's nextNumber or using code
      const currentNext = parent.nextNumber || parent.accountCode;
      if (accountCode >= currentNext) {
        parent.nextNumber = accountCode + 1;
        await this.coaRepo.save(parent);
      }
    }

    await this.activityLogsService.log({
      userId,
      moduleId: 'chart_of_accounts',
      action: 'create',
      entityType: 'chart_of_account',
      entityId: saved.id,
      description: `Created Chart of Account ${saved.description} (${saved.accountCode})`,
    });

    return saved;
  }

  async update(id: string, dto: UpdateChartOfAccountDto, userId: string): Promise<ChartOfAccount> {
    const coa = await this.coaRepo.findOne({ where: { id } });
    if (!coa) {
      throw new NotFoundException(`Chart of Account with ID ${id} not found`);
    }

    const accountCode = dto.account_code;
    const parentId = dto.parent_id;
    const isParent = dto.is_parent;
    const normalBalance = dto.normal_balance;
    const nextNumber = dto.next_number;
    const earningAccountId = dto.earning_account_id;

    if (accountCode !== undefined && accountCode !== coa.accountCode) {
      const codeExists = await this.coaRepo.findOne({ where: { accountCode } });
      if (codeExists) {
        throw new BadRequestException(`Account Code ${accountCode} already exists`);
      }
    }

    if (dto.key !== undefined && dto.key !== coa.key) {
      const keyExists = await this.coaRepo.findOne({ where: { key: dto.key } });
      if (keyExists) {
        throw new BadRequestException(`Account Key '${dto.key}' already exists`);
      }
    }

    if (parentId) {
      const parent = await this.coaRepo.findOne({ where: { id: parentId } });
      if (!parent) {
        throw new NotFoundException(`Parent account not found`);
      }
      if (!parent.isParent) {
        throw new BadRequestException(`Parent account must have is_parent = true`);
      }
    }

    Object.assign(coa, {
      accountCode: accountCode !== undefined ? accountCode : coa.accountCode,
      key: dto.key !== undefined ? dto.key : coa.key,
      description: dto.description !== undefined ? dto.description : coa.description,
      parentId: parentId !== undefined ? parentId : coa.parentId,
      isParent: isParent !== undefined ? isParent : coa.isParent,
      normalBalance: normalBalance !== undefined ? normalBalance : coa.normalBalance,
      nextNumber: nextNumber !== undefined ? nextNumber : coa.nextNumber,
      earningAccountId: earningAccountId !== undefined ? earningAccountId : coa.earningAccountId,
      notes: dto.notes !== undefined ? dto.notes : coa.notes,
      updatedBy: userId,
      updatedAt: new Date(),
    });

    const saved = await this.coaRepo.save(coa);

    await this.activityLogsService.log({
      userId,
      moduleId: 'chart_of_accounts',
      action: 'edit',
      entityType: 'chart_of_account',
      entityId: saved.id,
      description: `Updated Chart of Account ${saved.description} (${saved.accountCode})`,
    });

    return saved;
  }

  async delete(id: string, userId?: string): Promise<void> {
    const coa = await this.coaRepo.findOne({ where: { id } });
    if (!coa) {
      throw new NotFoundException(`Chart of Account not found`);
    }

    // Check if it has child accounts
    const children = await this.coaRepo.find({ where: { parentId: id } });
    if (children.length > 0) {
      throw new BadRequestException(`Cannot delete account: it has child accounts`);
    }

    await this.coaRepo.delete(id);

    await this.activityLogsService.log({
      userId,
      moduleId: 'chart_of_accounts',
      action: 'delete',
      entityType: 'chart_of_account',
      entityId: id,
      description: `Deleted Chart of Account ${coa.description} (${coa.accountCode})`,
    });
  }

  // ==========================================
  // DOCUMENT OPERATIONS
  // ==========================================
  async addDocument(
    coaId: string,
    fileName: string,
    fileUrl: string,
    documentType: string,
    userId: string,
  ): Promise<ChartOfAccountDocument> {
    const coa = await this.coaRepo.findOne({ where: { id: coaId } });
    if (!coa) {
      throw new NotFoundException(`Chart of Account with ID ${coaId} not found`);
    }

    const doc = this.docRepo.create({
      coaId,
      fileName,
      fileUrl,
      documentType,
      uploadedBy: userId,
    });

    return this.docRepo.save(doc);
  }

  async findDocument(id: string): Promise<ChartOfAccountDocument> {
    const doc = await this.docRepo.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return doc;
  }

  async deleteDocument(id: string): Promise<void> {
    const doc = await this.docRepo.findOne({ where: { id } });
    if (!doc) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    await this.docRepo.delete(id);
  }
}
