import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Module } from './entities/module.entity';

@Injectable()
export class ModulesService {
  constructor(
    @InjectRepository(Module)
    private readonly modulesRepository: Repository<Module>,
  ) {}

  async findAll() {
    return this.modulesRepository.find({ order: { name: 'ASC' } });
  }

  async findById(id: number) {
    return this.modulesRepository.findOneBy({ id });
  }
}
