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
    });
  }

  async beforeRemove(event: RemoveEvent<ObjectLiteral>): Promise<void> {
    if (SKIP_ENTITIES.has(event.metadata.name) || !event.entity) return;
    await this.writeLog(event.manager.getRepository(ActivityLog), {
      action: 'delete',
      entityType: event.metadata.name,
      entityId: this.getId(event.entity, event.metadata),
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
    });
  }

  private async writeLog(
    repo: ReturnType<DataSource['getRepository']>,
    fields: { action: string; entityType: string; entityId: string; changes?: FieldChange[] },
  ): Promise<void> {
    const userId = this.requestContext.getUserId();
    await repo.save(
      repo.create({
        userId: userId ?? undefined,
        action: fields.action,
        entityType: fields.entityType,
        entityId: fields.entityId,
        description: `${fields.action} ${fields.entityType} ${fields.entityId}`,
        ipAddress: this.requestContext.getIpAddress() ?? undefined,
        userAgent: this.requestContext.getUserAgent() ?? undefined,
        changes: fields.changes && fields.changes.length > 0 ? fields.changes : null,
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
