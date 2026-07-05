import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Broker } from '../../entities/broker.entity';

@Injectable()
export class BrokersDao {
  constructor(
    @InjectRepository(Broker)
    private readonly brokerRepo: Repository<Broker>,
  ) {}

  findAll(search?: string, isActive?: boolean): Promise<Broker[]> {
    const where: FindOptionsWhere<Broker>[] = [];
    if (search) {
      where.push({ name: ILike(`%${search}%`), ...(isActive !== undefined ? { isActive } : {}) });
      where.push({
        brokerCode: ILike(`%${search}%`),
        ...(isActive !== undefined ? { isActive } : {}),
      });
    } else {
      const obj: FindOptionsWhere<Broker> = {};
      if (isActive !== undefined) obj.isActive = isActive;
      where.push(obj);
    }
    return this.brokerRepo.find({
      where: where.length > 1 ? where : where[0],
      order: { brokerCode: 'ASC' },
    });
  }

  findById(id: string): Promise<Broker | null> {
    return this.brokerRepo.findOne({ where: { id } });
  }

  findByCode(brokerCode: string): Promise<Broker | null> {
    return this.brokerRepo.findOne({ where: { brokerCode } });
  }

  create(data: Partial<Broker>): Broker {
    return this.brokerRepo.create(data);
  }

  save(broker: Broker): Promise<Broker> {
    return this.brokerRepo.save(broker);
  }

  async delete(id: string): Promise<void> {
    const entity = await this.brokerRepo.findOne({ where: { id } });

    if (!entity) return;

    entity.isDeleted = true;

    entity.deletedAt = new Date();

    await this.brokerRepo.save(entity);
  }
}
