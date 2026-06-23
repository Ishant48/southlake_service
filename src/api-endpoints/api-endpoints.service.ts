import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiEndpoint } from './entities/api-endpoint.entity';

@Injectable()
export class ApiEndpointsService {
  constructor(
    @InjectRepository(ApiEndpoint)
    private readonly endpointsRepository: Repository<ApiEndpoint>,
  ) {}

  async findAll() {
    return this.endpointsRepository.find({
      relations: ['module'],
      order: { module: { name: 'ASC' }, method: 'ASC' },
    });
  }

  async findByModuleId(moduleId: number) {
    return this.endpointsRepository.find({
      where: { moduleId },
      order: { method: 'ASC' },
    });
  }

  async findById(id: number) {
    return this.endpointsRepository.findOne({
      where: { id },
      relations: ['module'],
    });
  }

  async findByMethodAndPath(method: string, path: string) {
    return this.endpointsRepository.findOne({
      where: { method, path },
      relations: ['module'],
    });
  }

  async findByModuleIds(moduleIds: number[]) {
    if (moduleIds.length === 0) return [];
    return this.endpointsRepository.find({
      where: moduleIds.map((id) => ({ moduleId: id })),
    });
  }
}
