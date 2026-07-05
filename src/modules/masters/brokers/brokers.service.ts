import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ActivityLogsService } from '../../activity-logs/activity-logs.service';
import { BrokersDao } from './dao/brokers.dao';
import { Broker } from '../entities/broker.entity';
import { CreateBrokerDto, UpdateBrokerDto } from '../dto/broker.dto';

/** CRUD for broker master records. */
@Injectable()
export class BrokersService {
  constructor(
    private readonly dao: BrokersDao,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async findAllBrokers(search?: string, isActive?: boolean): Promise<Broker[]> {
    return this.dao.findAll(search, isActive);
  }

  async findOneBroker(id: string): Promise<Broker> {
    const broker = await this.dao.findById(id);
    if (!broker) throw new NotFoundException('Broker not found');
    return broker;
  }

  async createBroker(dto: CreateBrokerDto, userId?: string): Promise<Broker> {
    const exists = await this.dao.findByCode(dto.broker_code);
    if (exists) throw new BadRequestException(`Broker code ${dto.broker_code} already exists`);

    const broker = this.dao.create({
      brokerCode: dto.broker_code,
      name: dto.name,
      contactName: dto.contact_name ?? null,
      contactEmail: dto.contact_email ?? null,
      contactPhone: dto.contact_phone ?? null,
      isActive: dto.is_active ?? true,
    });
    const saved = await this.dao.save(broker);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'create',
      entityType: 'broker',
      entityId: saved.id,
      description: `Created Broker ${saved.name} (${saved.brokerCode})`,
    });
    return saved;
  }

  async updateBroker(id: string, dto: UpdateBrokerDto, userId?: string): Promise<Broker> {
    const broker = await this.findOneBroker(id);
    if (dto.broker_code !== undefined && dto.broker_code !== broker.brokerCode) {
      const exists = await this.dao.findByCode(dto.broker_code);
      if (exists) throw new BadRequestException(`Broker code ${dto.broker_code} already exists`);
    }

    Object.assign(broker, {
      brokerCode: dto.broker_code ?? broker.brokerCode,
      name: dto.name ?? broker.name,
      contactName: dto.contact_name ?? broker.contactName,
      contactEmail: dto.contact_email ?? broker.contactEmail,
      contactPhone: dto.contact_phone ?? broker.contactPhone,
      isActive: dto.is_active ?? broker.isActive,
    });
    const saved = await this.dao.save(broker);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'edit',
      entityType: 'broker',
      entityId: saved.id,
      description: `Updated Broker ${saved.name} (${saved.brokerCode})`,
    });
    return saved;
  }

  async deleteBroker(id: string, userId?: string): Promise<void> {
    const broker = await this.findOneBroker(id);
    await this.dao.delete(id);
    await this.activityLogsService.log({
      userId,
      moduleId: 'master_data',
      action: 'delete',
      entityType: 'broker',
      entityId: id,
      description: `Deleted Broker ${broker.name} (${broker.brokerCode})`,
    });
  }
}
