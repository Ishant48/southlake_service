import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserEndpoint } from './entities/user-endpoint.entity';
import { UserModule } from './entities/user-module.entity';
import { CreateUserDto, UpdateUserDto, UpdateStatusDto } from './dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(UserEndpoint)
    private readonly userEndpointsRepository: Repository<UserEndpoint>,
    @InjectRepository(UserModule)
    private readonly userModulesRepository: Repository<UserModule>,
  ) {}

  async findAll() {
    return this.usersRepository.find({
      relations: ['role'],
      select: ['id', 'username', 'email', 'isActive', 'isSuperAdmin', 'roleId', 'createdAt', 'updatedAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role', 'userEndpoints', 'userModules'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['role', 'userEndpoints', 'userModules'],
    });
  }

  async findByEmailWithPassword(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['role', 'userEndpoints', 'userModules'],
      select: ['id', 'username', 'email', 'password', 'isActive', 'isSuperAdmin', 'roleId', 'createdAt', 'updatedAt'],
    });
  }

  async findWithPermissions(id: number) {
    return this.usersRepository.findOne({
      where: { id },
      relations: [
        'role',
        'role.roleEndpoints',
        'role.roleModules',
        'userEndpoints',
        'userModules',
      ],
    });
  }

  async create(dto: CreateUserDto) {
    const existing = await this.usersRepository.findOneBy({ email: dto.email });
    if (existing) throw new ConflictException('Email already in use');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepository.create({
      username: dto.username,
      email: dto.email,
      password: hashedPassword,
      roleId: dto.roleId ?? null,
    });

    const saved = await this.usersRepository.save(user);
    this.logger.log(`User created: ${saved.email}`);
    return this.findById(saved.id);
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.findById(id);
    if (dto.email && dto.email !== user.email) {
      const existing = await this.usersRepository.findOneBy({ email: dto.email });
      if (existing) throw new ConflictException('Email already in use');
    }
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }
    Object.assign(user, dto);
    await this.usersRepository.save(user);
    return this.findById(id);
  }

  async updateStatus(id: number, dto: UpdateStatusDto) {
    const user = await this.findById(id);
    user.isActive = dto.isActive;
    await this.usersRepository.save(user);
    this.logger.log(`User ${user.email} status: ${dto.isActive ? 'active' : 'inactive'}`);
    return this.findById(id);
  }

  async assignEndpoints(userId: number, endpointIds: number[]) {
    await this.findById(userId);
    await this.userEndpointsRepository.delete({ userId });
    const entries = endpointIds.map((endpointId) =>
      this.userEndpointsRepository.create({ userId, endpointId }),
    );
    await this.userEndpointsRepository.save(entries);
    return this.findById(userId);
  }

  async assignModules(userId: number, moduleIds: number[]) {
    await this.findById(userId);
    await this.userModulesRepository.delete({ userId });
    const entries = moduleIds.map((moduleId) =>
      this.userModulesRepository.create({ userId, moduleId }),
    );
    await this.userModulesRepository.save(entries);
    return this.findById(userId);
  }
}
