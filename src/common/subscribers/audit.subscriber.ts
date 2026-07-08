import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  ObjectLiteral,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { RequestContextService } from '../context/request-context';
import { ActivityLog } from '../../modules/activity-logs/entities/activity-log.entity';

/**
 * Entities excluded from audit logging: either the log table itself
 * (would recurse) or high-volume/security-noise tables where a row-level
 * audit trail adds no value (sessions, OTP codes, challenge tokens).
 */
const SKIP_ENTITIES = new Set(['ActivityLog', 'UserSession', 'LoginOtp', 'LoginChallenge']);

const ENTITY_TO_MODULE_MAP: Record<string, string> = {
  User: 'user',
  Role: 'role',
  Permission: 'permission',
  ChartOfAccount: 'chart_of_accounts',
  ChartOfAccounts: 'chart_of_accounts',
  GlMapping: 'gl_mapping',
  JournalEntry: 'journal_entry',
  JournalEntryBatch: 'journal_entry',
  BrokerMaster: 'broker',
  CobMaster: 'cob',
  LobMaster: 'lob',
  StateMaster: 'state',
  ReinsurerCompany: 'reinsurer',
  Carrier: 'risk_company',
  Treaty: 'treaty',
  ProductMaster: 'product',
  DocumentTypeMaster: 'masters_config',
  SequencePrefixMaster: 'masters_config',
  LockedPeriod: 'masters_config',
  Workbook: 'workbook',
  MgaMaster: 'mga',
};

export interface FieldChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * Runs on every entity insert/update/remove that goes through
 * Repository.save()/remove() (not repo.update()/.delete(), which are raw
 * queries TypeORM subscribers never see — see docs/AUDIT_LOGGING.md).
 * Auto-stamps createdBy/updatedBy from the current request's user, and
 * writes a field-level before/after diff to activity_logs for updates.
 */
@EventSubscriber()
@Injectable()
export class AuditSubscriber implements EntitySubscriberInterface {
  constructor(
    @InjectDataSource() dataSource: DataSource,
    private readonly requestContext: RequestContextService,
  ) {
    dataSource.subscribers.push(this);
  }

  beforeInsert(event: InsertEvent<ObjectLiteral>): void {
    this.stampAuditColumns(event, true);
  }

  beforeUpdate(event: UpdateEvent<ObjectLiteral>): void {
    this.stampAuditColumns(event, false);
  }

  async afterInsert(event: InsertEvent<ObjectLiteral>): Promise<void> {
    if (SKIP_ENTITIES.has(event.metadata.name)) return;
    await this.writeLog(event.manager.getRepository(ActivityLog), {
      action: 'create',
      entityType: event.metadata.name,
      entityId: this.getId(event.entity, event.metadata),
      entityObj: event.entity,
    });
  }

  async beforeRemove(event: RemoveEvent<ObjectLiteral>): Promise<void> {
    if (SKIP_ENTITIES.has(event.metadata.name) || !event.entity) return;
    await this.writeLog(event.manager.getRepository(ActivityLog), {
      action: 'delete',
      entityType: event.metadata.name,
      entityId: this.getId(event.entity, event.metadata),
      entityObj: event.entity,
    });
  }

  async afterUpdate(event: UpdateEvent<ObjectLiteral>): Promise<void> {
    if (SKIP_ENTITIES.has(event.metadata.name) || !event.entity || !event.databaseEntity) return;

    const entity = event.entity;
    const databaseEntity = event.databaseEntity;

    const becameSoftDeleted = databaseEntity.isDeleted === false && entity.isDeleted === true;

    const changes: FieldChange[] = (event.updatedColumns || [])
      .map(col => ({
        field: col.propertyName,
        oldValue: databaseEntity[col.propertyName] as unknown,
        newValue: col.getEntityValue(entity) as unknown,
      }))
      // Audit columns changing on every write (updatedBy/updatedAt) aren't
      // meaningful "what changed" entries on their own. A soft-delete's own
      // bookkeeping columns (isDeleted/deletedAt/deletedBy) are represented
      // by the 'delete' action itself, not as a diff.
      .filter(c => !['updatedAt', 'updatedBy'].includes(c.field))
      .filter(
        c => !(becameSoftDeleted && ['isDeleted', 'deletedAt', 'deletedBy'].includes(c.field)),
      )
      .filter(c => c.oldValue !== c.newValue);

    if (changes.length === 0 && !becameSoftDeleted) return;

    await this.writeLog(event.manager.getRepository(ActivityLog), {
      action: becameSoftDeleted ? 'delete' : 'update',
      entityType: event.metadata.name,
      entityId: this.getId(event.databaseEntity, event.metadata),
      changes,
      entityObj: event.entity,
    });
  }

  private async writeLog(
    repo: ReturnType<DataSource['getRepository']>,
    fields: { action: string; entityType: string; entityId: string; changes?: FieldChange[]; entityObj?: any },
  ): Promise<void> {
    const userId = this.requestContext.getUserId();
    const rawType = fields.entityType;
    const entity = fields.entityObj;

    const moduleId = ENTITY_TO_MODULE_MAP[rawType] || 'rbac';

    let displayEntityName = rawType;
    if (entity) {
      const nameVal = entity.name || entity.label || entity.batchNumber || entity.treatyCode || entity.code || '';
      if (nameVal) {
        let typeName = rawType;
        if (rawType === 'Carrier') typeName = 'Risk Company';
        else if (rawType === 'MgaMaster') typeName = 'MGA';
        else if (rawType === 'CobMaster') typeName = 'COB';
        else if (rawType === 'LobMaster') typeName = 'LOB';
        else if (rawType === 'StateMaster') typeName = 'State';
        else if (rawType === 'ReinsurerCompany') typeName = 'Reinsurer';
        else if (rawType === 'BrokerMaster') typeName = 'Broker';
        else if (rawType === 'ProductMaster') typeName = 'Product';
        else if (rawType === 'JournalEntryBatch') typeName = 'Journal Entry';

        displayEntityName = `${typeName} - ${nameVal}`;
      }
    }

    let description = `${fields.action} ${rawType} ${fields.entityId}`;
    if (entity) {
      const name = entity.name || entity.label || entity.batchNumber || entity.treatyCode || entity.code || 'Item';
      if (rawType === 'User') {
        if (fields.action === 'create') description = `Created a new user account for ${name}`;
        else if (fields.action === 'update') description = `Updated user profile for ${name}`;
        else if (fields.action === 'delete') description = `Deactivated user account for ${name}`;
      } else if (rawType === 'Role') {
        if (fields.action === 'create') description = `Created a new security role: ${name}`;
        else if (fields.action === 'update') description = `Updated permissions and configurations for role ${name}`;
        else if (fields.action === 'delete') description = `Deleted role ${name}`;
      } else {
        let typeName = rawType;
        if (rawType === 'Carrier') typeName = 'risk company';
        else if (rawType === 'MgaMaster') typeName = 'MGA';
        else if (rawType === 'CobMaster') typeName = 'COB';
        else if (rawType === 'LobMaster') typeName = 'LOB';
        else if (rawType === 'StateMaster') typeName = 'state';
        else if (rawType === 'ReinsurerCompany') typeName = 'reinsurer';
        else if (rawType === 'BrokerMaster') typeName = 'broker';
        else if (rawType === 'ProductMaster') typeName = 'product';
        else if (rawType === 'JournalEntryBatch') typeName = 'journal entry';

        if (fields.action === 'create') description = `Created a new ${typeName.toLowerCase()}: ${name}`;
        else if (fields.action === 'update') description = `Updated details for ${typeName.toLowerCase()}: ${name}`;
        else if (fields.action === 'delete') description = `Deleted ${typeName.toLowerCase()}: ${name}`;
      }
    }

    await repo.save(
      repo.create({
        userId: userId ?? undefined,
        moduleId,
        action: fields.action,
        entityType: displayEntityName,
        entityId: fields.entityId,
        description,
        ipAddress: this.requestContext.getIpAddress() ?? undefined,
        userAgent: this.requestContext.getUserAgent() ?? undefined,
        fieldChanges: fields.changes && fields.changes.length > 0 ? fields.changes : null,
        status: 'Success',
        device: this.requestContext.getDevice() ?? undefined,
        os: this.requestContext.getOs() ?? undefined,
        browser: this.requestContext.getBrowser() ?? undefined,
        location: this.requestContext.getLocation() ?? undefined,
        sessionId: this.requestContext.getSessionId() ?? undefined,
        correlationId: this.requestContext.getCorrelationId() ?? undefined,
      }),
    );
  }

  private getId(
    entity: ObjectLiteral | undefined,
    metadata: UpdateEvent<ObjectLiteral>['metadata'],
  ): string {
    const idColumn = metadata.primaryColumns[0]?.propertyName ?? 'id';
    return entity?.[idColumn] != null ? String(entity[idColumn]) : '';
  }

  private stampAuditColumns(
    event: InsertEvent<ObjectLiteral> | UpdateEvent<ObjectLiteral>,
    isInsert: boolean,
  ): void {
    const entity = event.entity;
    if (!entity) return;
    const userId = this.requestContext.getUserId();
    if (!userId) return;

    const hasColumn = (name: string) => event.metadata.columns.some(c => c.propertyName === name);

    if (isInsert && hasColumn('createdBy') && entity.createdBy === undefined) {
      entity.createdBy = userId;
    }
    if (hasColumn('updatedBy')) {
      entity.updatedBy = userId;
    }
    if (!isInsert && entity.isDeleted === true && hasColumn('deletedBy') && !entity.deletedBy) {
      entity.deletedBy = userId;
    }
  }
}
