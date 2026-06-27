import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsService } from './permissions.service';
import { PermissionsDao } from './dao/permissions.dao';
import { Permission } from './entities/permission.entity';
import { Module } from './entities/module.entity';
import { Submodule } from './entities/submodule.entity';

// ─── Test constants ───────────────────────────────────────────────────────────
const TEST_DATE = new Date('2025-01-01T00:00:00.000Z');

// ─── Factory functions ────────────────────────────────────────────────────────
const createMockPermission = (overrides: Partial<Permission> = {}): Permission =>
  ({
    id: 'perm-uuid',
    action: 'view',
    label: 'View',
    description: null,
    ...overrides,
  }) as Permission;

const createMockSubmodule = (overrides: Partial<Submodule> = {}): Submodule =>
  ({
    id: 'sub-uuid',
    label: 'Users',
    moduleId: 'user_management',
    ...overrides,
  }) as Submodule;

const createMockModule = (overrides: Partial<Module> = {}): Module =>
  ({
    id: 'user_management',
    label: 'User Management',
    isActive: true,
    submodules: [createMockSubmodule()],
    createdAt: TEST_DATE,
    updatedAt: TEST_DATE,
    createdBy: null,
    updatedBy: null,
    ...overrides,
  }) as Module;

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockPermissionsDao = {
  findAllPermissions: jest.fn(),
  findAllModules: jest.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('PermissionsService', () => {
  let service: PermissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionsService, { provide: PermissionsDao, useValue: mockPermissionsDao }],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    jest.clearAllMocks();
  });

  // ─── findAll ──────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should delegate directly to DAO and return all permissions', async () => {
      const perms = [
        createMockPermission(),
        createMockPermission({ id: 'perm-2', action: 'create' }),
      ];
      mockPermissionsDao.findAllPermissions.mockResolvedValue(perms);

      const result = await service.findAll();

      expect(result).toBe(perms);
      expect(mockPermissionsDao.findAllPermissions).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no permissions are defined', async () => {
      mockPermissionsDao.findAllPermissions.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });

    it('should not transform or filter the DAO result', async () => {
      const perms = [
        createMockPermission({ action: 'view' }),
        createMockPermission({ id: 'p2', action: 'create' }),
        createMockPermission({ id: 'p3', action: 'export' }),
      ];
      mockPermissionsDao.findAllPermissions.mockResolvedValue(perms);

      const result = await service.findAll();

      expect(result).toHaveLength(3);
      expect(result).toBe(perms);
    });

    it('should not call findAllModules when fetching permissions', async () => {
      mockPermissionsDao.findAllPermissions.mockResolvedValue([]);

      await service.findAll();

      expect(mockPermissionsDao.findAllModules).not.toHaveBeenCalled();
    });

    it('should preserve all permission fields in the result', async () => {
      const perm = createMockPermission({ id: 'specific-id', action: 'approve', label: 'Approve' });
      mockPermissionsDao.findAllPermissions.mockResolvedValue([perm]);

      const result = await service.findAll();

      expect(result[0].id).toBe('specific-id');
      expect(result[0].action).toBe('approve');
      expect(result[0].label).toBe('Approve');
    });
  });

  // ─── findAllModules ───────────────────────────────────────────────────────
  describe('findAllModules', () => {
    it('should delegate directly to DAO and return all modules', async () => {
      const modules = [createMockModule(), createMockModule({ id: 'reports', label: 'Reports' })];
      mockPermissionsDao.findAllModules.mockResolvedValue(modules);

      const result = await service.findAllModules();

      expect(result).toBe(modules);
      expect(mockPermissionsDao.findAllModules).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no modules are defined', async () => {
      mockPermissionsDao.findAllModules.mockResolvedValue([]);

      const result = await service.findAllModules();

      expect(result).toEqual([]);
    });

    it('should not transform or filter the DAO result', async () => {
      const modules = [createMockModule(), createMockModule({ id: 'accounts', label: 'Accounts' })];
      mockPermissionsDao.findAllModules.mockResolvedValue(modules);

      const result = await service.findAllModules();

      expect(result).toHaveLength(2);
      expect(result).toBe(modules);
    });

    it('should not call findAllPermissions when fetching modules', async () => {
      mockPermissionsDao.findAllModules.mockResolvedValue([]);

      await service.findAllModules();

      expect(mockPermissionsDao.findAllPermissions).not.toHaveBeenCalled();
    });

    it('should return modules with their nested submodules intact', async () => {
      const submodule = createMockSubmodule({ id: 'sub-1', label: 'Sub Users' });
      const mod = createMockModule({ submodules: [submodule] });
      mockPermissionsDao.findAllModules.mockResolvedValue([mod]);

      const result = await service.findAllModules();

      expect(result[0].submodules).toHaveLength(1);
      expect(result[0].submodules[0].id).toBe('sub-1');
    });

    it('should return modules without submodules when submodules array is empty', async () => {
      const mod = createMockModule({ submodules: [] });
      mockPermissionsDao.findAllModules.mockResolvedValue([mod]);

      const result = await service.findAllModules();

      expect(result[0].submodules).toHaveLength(0);
    });
  });
});
