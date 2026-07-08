import { Test, TestingModule } from '@nestjs/testing';
import { QueryFailedError } from 'typeorm';
import { RolesService } from './roles.service';
import { RolesDao } from './dao/roles.dao';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { PermissionCacheService } from '../../common/cache/permission-cache.service';
import { User } from '../users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';

function uniqueViolation(): QueryFailedError {
  const err = new QueryFailedError('INSERT INTO roles ...', [], {
    code: '23505',
    message: 'duplicate key value violates unique constraint',
  } as unknown as Error);
  return err;
}

interface MockRolesDao {
  save: jest.Mock;
  findByName: jest.Mock;
  findById: jest.Mock;
  findPermissions: jest.Mock;
  findAllPermissionsList: jest.Mock;
  upsertPermissions: jest.Mock;
}

interface MockActivityLogsService {
  log: jest.Mock;
}

describe('RolesService', () => {
  let service: RolesService;
  let dao: MockRolesDao;
  let activityLogsService: MockActivityLogsService;
  const createdBy = { id: 'user-1' } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: RolesDao,
          useValue: {
            save: jest.fn(),
            findByName: jest.fn(),
            findById: jest.fn(),
            findPermissions: jest.fn(),
            findAllPermissionsList: jest.fn(),
            upsertPermissions: jest.fn(),
          },
        },
        {
          provide: ActivityLogsService,
          useValue: { log: jest.fn() },
        },
        {
          provide: getRepositoryToken(User),
          useValue: { count: jest.fn() },
        },
        {
          provide: PermissionCacheService,
          useValue: { invalidateAll: jest.fn(), invalidate: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(RolesService);
    dao = module.get(RolesDao);
    activityLogsService = module.get(ActivityLogsService);
  });

  describe('create() slug generation', () => {
    it('derives a lowercase, underscore-separated slug from the label', async () => {
      dao.save.mockImplementation(
        role => Promise.resolve({ ...role, id: 'role-1' }) as Promise<Role>,
      );

      const dto: CreateRoleDto = { label: 'Senior Underwriter!!' };
      const result = await service.create(dto, createdBy);

      expect(result.name).toBe('senior_underwriter');
      expect(dao.save).toHaveBeenCalledTimes(1);
      expect(activityLogsService.log).toHaveBeenCalled();
    });

    it('trims leading/trailing separators produced by non-alphanumeric edges', async () => {
      dao.save.mockImplementation(
        role => Promise.resolve({ ...role, id: 'role-1' }) as Promise<Role>,
      );

      const dto: CreateRoleDto = { label: '--Ops & Claims--' };
      const result = await service.create(dto, createdBy);

      expect(result.name).toBe('ops_claims');
    });

    it('retries with a numeric suffix on a Postgres unique-violation', async () => {
      dao.save
        .mockRejectedValueOnce(uniqueViolation())
        .mockImplementationOnce(
          role => Promise.resolve({ ...role, id: 'role-2' }) as Promise<Role>,
        );

      const dto: CreateRoleDto = { label: 'Underwriter' };
      const result = await service.create(dto, createdBy);

      expect(dao.save).toHaveBeenCalledTimes(2);
      expect(dao.save).toHaveBeenNthCalledWith(1, expect.objectContaining({ name: 'underwriter' }));
      expect(dao.save).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ name: 'underwriter_2' }),
      );
      expect(result.name).toBe('underwriter_2');
    });

    it('keeps incrementing the suffix across multiple collisions', async () => {
      dao.save
        .mockRejectedValueOnce(uniqueViolation())
        .mockRejectedValueOnce(uniqueViolation())
        .mockImplementationOnce(
          role => Promise.resolve({ ...role, id: 'role-3' }) as Promise<Role>,
        );

      const dto: CreateRoleDto = { label: 'Underwriter' };
      const result = await service.create(dto, createdBy);

      expect(dao.save).toHaveBeenCalledTimes(3);
      expect(dao.save).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({ name: 'underwriter_3' }),
      );
      expect(result.name).toBe('underwriter_3');
    });

    it('propagates non-unique-violation errors without retrying', async () => {
      const otherError = new Error('connection lost');
      dao.save.mockRejectedValueOnce(otherError);

      const dto: CreateRoleDto = { label: 'Underwriter' };
      await expect(service.create(dto, createdBy)).rejects.toThrow('connection lost');
      expect(dao.save).toHaveBeenCalledTimes(1);
    });

    it('falls back to "role" when the label has no alphanumeric characters', async () => {
      dao.save.mockImplementation(
        role => Promise.resolve({ ...role, id: 'role-1' }) as Promise<Role>,
      );

      const dto: CreateRoleDto = { label: '!!!' };
      const result = await service.create(dto, createdBy);

      expect(result.name).toBe('role');
    });
  });
});
