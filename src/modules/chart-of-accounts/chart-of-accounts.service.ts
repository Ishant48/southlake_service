import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ILike } from 'typeorm';
import { ChartOfAccount } from './entities/chart-of-account.entity';
import { ChartOfAccountDocument } from './entities/chart-of-account-document.entity';
import { CreateChartOfAccountDto } from './dto/create-chart-of-account.dto';
import { UpdateChartOfAccountDto } from './dto/update-chart-of-account.dto';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { ChartOfAccountsDao } from './dao/chart-of-accounts.dao';

@Injectable()
export class ChartOfAccountsService {
  constructor(
    private readonly coaDao: ChartOfAccountsDao,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async findAll(search?: string, isActive?: boolean): Promise<ChartOfAccount[]> {
    const where: Record<string, unknown> = {};
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

    return this.coaDao.findAll(where);
  }

  async findOne(id: string): Promise<ChartOfAccount & { documents: ChartOfAccountDocument[] }> {
    const coa = await this.coaDao.findById(id);

    if (!coa) {
      throw new NotFoundException(`Chart of Account with ID ${id} not found`);
    }

    const documents = await this.coaDao.findDocumentsByCoaId(id);

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
    const codeExists = await this.coaDao.findByAccountCode(accountCode);
    if (codeExists) {
      throw new BadRequestException(`Account Code ${accountCode} already exists`);
    }

    // Check if key is unique if specified
    if (dto.key) {
      const keyExists = await this.coaDao.findByKey(dto.key);
      if (keyExists) {
        throw new BadRequestException(`Account Key '${dto.key}' already exists`);
      }
    }

    let parent: ChartOfAccount | null = null;
    if (parentId) {
      parent = await this.coaDao.findById(parentId);
      if (!parent) {
        throw new NotFoundException(`Parent account not found`);
      }
      if (!parent.isParent) {
        throw new BadRequestException(`Parent account must have is_parent = true`);
      }
    }

    let earningAccount: ChartOfAccount | null = null;
    if (earningAccountId) {
      earningAccount = await this.coaDao.findById(earningAccountId);
      if (!earningAccount) {
        throw new NotFoundException(`Earning account not found`);
      }
    }

    const coa = this.coaDao.create({
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

    const saved = await this.coaDao.save(coa);

    // If parent exists and nextNumber needs tracking
    if (parent) {
      // Suggest next number by incrementing parent's nextNumber or using code
      const currentNext = parent.nextNumber ?? parent.accountCode;
      if (accountCode >= currentNext) {
        parent.nextNumber = accountCode + 1;
        await this.coaDao.save(parent);
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
    const coa = await this.coaDao.findById(id);
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
      const codeExists = await this.coaDao.findByAccountCode(accountCode);
      if (codeExists) {
        throw new BadRequestException(`Account Code ${accountCode} already exists`);
      }
    }

    if (dto.key !== undefined && dto.key !== coa.key) {
      const keyExists = await this.coaDao.findByKey(dto.key);
      if (keyExists) {
        throw new BadRequestException(`Account Key '${dto.key}' already exists`);
      }
    }

    if (parentId) {
      const parent = await this.coaDao.findById(parentId);
      if (!parent) {
        throw new NotFoundException(`Parent account not found`);
      }
      if (!parent.isParent) {
        throw new BadRequestException(`Parent account must have is_parent = true`);
      }
    }

    Object.assign(coa, {
      accountCode: accountCode ?? coa.accountCode,
      key: dto.key ?? coa.key,
      description: dto.description ?? coa.description,
      parentId: parentId ?? coa.parentId,
      isParent: isParent ?? coa.isParent,
      normalBalance: normalBalance ?? coa.normalBalance,
      nextNumber: nextNumber ?? coa.nextNumber,
      earningAccountId: earningAccountId ?? coa.earningAccountId,
      notes: dto.notes ?? coa.notes,
      updatedBy: userId,
      updatedAt: new Date(),
    });

    const saved = await this.coaDao.save(coa);

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
    const coa = await this.coaDao.findById(id);
    if (!coa) {
      throw new NotFoundException(`Chart of Account not found`);
    }

    // Check if it has child accounts
    const children = await this.coaDao.findChildren(id);
    if (children.length > 0) {
      throw new BadRequestException(`Cannot delete account: it has child accounts`);
    }

    await this.coaDao.delete(id);

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
    const coa = await this.coaDao.findById(coaId);
    if (!coa) {
      throw new NotFoundException(`Chart of Account with ID ${coaId} not found`);
    }

    const doc = this.coaDao.createDocument({
      coaId,
      fileName,
      fileUrl,
      documentType,
      uploadedBy: userId,
    });

    return this.coaDao.saveDocument(doc);
  }

  async findDocument(id: string): Promise<ChartOfAccountDocument> {
    const doc = await this.coaDao.findDocumentById(id);
    if (!doc) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    return doc;
  }

  async deleteDocument(id: string): Promise<void> {
    const doc = await this.coaDao.findDocumentById(id);
    if (!doc) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }
    await this.coaDao.deleteDocument(id);
  }
}
