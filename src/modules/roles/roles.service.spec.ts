import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RolesService } from './roles.service';
import { RolesDao } from './dao/roles.dao';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { Role } from './entities/role.entity';
import { User } from '../users/entities/user.entity';
import { RolePermission } from './entities/role-permission.entity';

// ─── Test constants ───────────────────────────────────────────────────────────
const TEST_ROLE_ID = 'role-test-uuid';
const TEST_USER_ID = 'user-test-uuid';
const TEST_DATE = new Date('2025-01-01T00:00:00.000Z');

// ─── Factory functions ────────────────────────────────────────────────────────
const createMockRole = (overrides: Partial<Role> = {}): Role =>
  ({
    id: TEST_ROLE_ID,
    name: 'manager',
    label: 'Manager',
    color: '#4A90D9',
    description: 'Manager role',
    isSystem: false,
    createdAt: TEST_DATE,
    updatedAt: TEST_DATE,
    createdBy: null,
    updatedBy: null,
    ...overrides,
  }) as Role;

const createMockUser = (overrides: Partial<User> = {}): User =>
  ({
    id: TEST_USER_ID,
    email: 'admin@southlake.com',
    name: 'Admin User',
    status: 'active',
    roleId: TEST_ROLE_ID,
    userType: 'staff',
    isDeleted: false,
    createdAt: TEST_DATE,
    updatedAt: TEST_DATE,
    ...overrides,
  }) as User;

const createMockRolePermission = (overrides: Partial<RolePermission> = {}): RolePermission =>
  ({
    id: 'rp-uuid',
    roleId: TEST_ROLE_ID,
    moduleId: 'user_management',
    permissionId: 'view-perm-uuid',
    ...overrides,
  }) as RolePermission;

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockRolesDao = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findPermissions: jest.fn(),
  upsertPermissions: jest.fn(),
};

const mockUserRepo = { count: jest.fn() };
const mockActivityLogsService = { log: jest.fn() };

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('RolesService', () => {
  let service: RolesService;
  const adminUser = createMockUser();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: RolesDao, useValue: mockRolesDao },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
        { provide: ActivityLogsService, useValue: mockActivityLogsService },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
    jest.clearAllMocks();

    mockActivityLogsService.log.mockResolvedValue(undefined);
  });

  // ─── findAll ──────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated roles with user counts', async () => {
      const roles = [createMockRole(), createMockRole({ id: 'role-2', name: 'staff' })];
      mockRolesDao.findAll.mockResolvedValue([roles, 2]);
      mockUserRepo.count.mockResolvedValue(5);

      const result = await service.findAll(1, 20);

      expect(result.data).toHaveLength(2);
      expect(result.data[0].user_count).toBe(5);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.per_page).toBe(20);
      expect(result.total_pages).toBe(1);
    });

    it('should return empty data and total_pages=0 when no roles exist', async () => {
      mockRolesDao.findAll.mockResolvedValue([[], 0]);

      const result = await service.findAll(1, 20);

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.total_pages).toBe(0);
    });

    it('should calculate total_pages correctly with fractional division', async () => {
      const roles = [createMockRole(), createMockRole({ id: 'r2' }), createMockRole({ id: 'r3' })];
      mockRolesDao.findAll.mockResolvedValue([roles, 5]);
      mockUserRepo.count.mockResolvedValue(0);

      const result = await service.findAll(1, 2);

      expect(result.total_pages).toBe(3); // ceil(5/2)
      expect(result.per_page).toBe(2);
    });

    it('should query user_count independently for each role', async () => {
      const roles = [createMockRole({ id: 'role-a' }), createMockRole({ id: 'role-b' })];
      mockRolesDao.findAll.mockResolvedValue([roles, 2]);
      mockUserRepo.count.mockResolvedValueOnce(10).mockResolvedValueOnce(3);

      const result = await service.findAll(1, 20);

      expect(result.data[0].user_count).toBe(10);
      expect(result.data[1].user_count).toBe(3);
      expect(mockUserRepo.count).toHaveBeenCalledTimes(2);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return role with user count and flattened permissions', async () => {
      mockRolesDao.findById.mockResolvedValue(createMockRole());
      mockUserRepo.count.mockResolvedValue(3);
      mockRolesDao.findPermissions.mockResolvedValue([]);

      const result = await service.findOne(TEST_ROLE_ID);

      expect(result.user_count).toBe(3);
      expect(result.permissions).toEqual([]);
    });

    it('should throw NotFoundException when role does not exist', async () => {
      mockRolesDao.findById.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should flatten permissions by module', async () => {
      const perms = [
        { ...createMockRolePermission(), permission: { action: 'view' } },
        {
          ...createMockRolePermission(),
          moduleId: 'user_management',
          permission: { action: 'create' },
        },
      ] as any[];

      mockRolesDao.findById.mockResolvedValue(createMockRole());
      mockUserRepo.count.mockResolvedValue(0);
      mockRolesDao.findPermissions.mockResolvedValue(perms);

      const result = await service.findOne(TEST_ROLE_ID);

      expect(result.permissions).toHaveLength(1);
      expect(result.permissions[0].module_id).toBe('user_management');
      expect(result.permissions[0].view).toBe(true);
      expect(result.permissions[0].create).toBe(true);
    });

    it('should produce separate permission entries for different modules', async () => {
      const perms = [
        {
          ...createMockRolePermission(),
          moduleId: 'user_management',
          permission: { action: 'view' },
        },
        { ...createMockRolePermission(), moduleId: 'reports', permission: { action: 'export' } },
      ] as any[];

      mockRolesDao.findById.mockResolvedValue(createMockRole());
      mockUserRepo.count.mockResolvedValue(0);
      mockRolesDao.findPermissions.mockResolvedValue(perms);

      const result = await service.findOne(TEST_ROLE_ID);

      expect(result.permissions).toHaveLength(2);
      const moduleIds = result.permissions.map((p: any) => p.module_id);
      expect(moduleIds).toContain('user_management');
      expect(moduleIds).toContain('reports');
    });

    it('should default all actions to false for actions not in the permissions list', async () => {
      const perms = [
        {
          ...createMockRolePermission(),
          moduleId: 'user_management',
          permission: { action: 'view' },
        },
      ] as any[];

      mockRolesDao.findById.mockResolvedValue(createMockRole());
      mockUserRepo.count.mockResolvedValue(0);
      mockRolesDao.findPermissions.mockResolvedValue(perms);

      const result = await service.findOne(TEST_ROLE_ID);

      const perm = result.permissions[0];
      expect(perm.view).toBe(true);
      expect(perm.create).toBe(false);
      expect(perm.edit).toBe(false);
      expect(perm.approve).toBe(false);
      expect(perm.export).toBe(false);
    });

    it('should set known actions from ALL_ACTIONS to false by default per module', async () => {
      const perms = [
        {
          ...createMockRolePermission(),
          moduleId: 'user_management',
          permission: { action: 'view' },
        },
      ] as any[];

      mockRolesDao.findById.mockResolvedValue(createMockRole());
      mockUserRepo.count.mockResolvedValue(0);
      mockRolesDao.findPermissions.mockResolvedValue(perms);

      const result = await service.findOne(TEST_ROLE_ID);

      const perm = result.permissions[0];
      expect(perm.view).toBe(true);
      expect(perm.create).toBe(false);
      expect(perm.edit).toBe(false);
      expect(perm.post).toBe(false);
      expect(perm.lock).toBe(false);
    });

    it('should not call findPermissions when role not found', async () => {
      mockRolesDao.findById.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
      expect(mockRolesDao.findPermissions).not.toHaveBeenCalled();
    });
  });

  // ─── create ───────────────────────────────────────────────────────────────
  describe('create', () => {
    const createDto = { name: 'new-role', label: 'New Role', color: '#FF0000' };

    it('should throw BadRequestException when name already exists', async () => {
      mockRolesDao.findByName.mockResolvedValue(createMockRole());

      await expect(service.create(createDto as any, adminUser)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockRolesDao.save).not.toHaveBeenCalled();
    });

    it('should create role with user_count 0 and log the action', async () => {
      mockRolesDao.findByName.mockResolvedValue(null);
      mockRolesDao.save.mockResolvedValue(createMockRole({ name: 'new-role' }));

      const result = await service.create(createDto as any, adminUser);

      expect(result.user_count).toBe(0);
      expect(mockRolesDao.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'new-role', createdBy: TEST_USER_ID }),
      );
      expect(mockActivityLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'create', entityType: 'role' }),
      );
    });

    it('should always force isSystem=false regardless of dto value', async () => {
      mockRolesDao.findByName.mockResolvedValue(null);
      mockRolesDao.save.mockResolvedValue(createMockRole({ isSystem: false }));

      await service.create({ ...createDto, isSystem: true } as any, adminUser);

      const savedPayload = mockRolesDao.save.mock.calls[0][0];
      expect(savedPayload.isSystem).toBe(false);
    });

    it('should store null for optional color/description when not provided', async () => {
      const minimalDto = { name: 'bare-role', label: 'Bare' };
      mockRolesDao.findByName.mockResolvedValue(null);
      mockRolesDao.save.mockResolvedValue(
        createMockRole({ name: 'bare-role', color: null, description: null }),
      );

      await service.create(minimalDto as any, adminUser);

      const savedPayload = mockRolesDao.save.mock.calls[0][0];
      expect(savedPayload.color === undefined || savedPayload.color === null).toBe(true);
      expect(savedPayload.description === undefined || savedPayload.description === null).toBe(
        true,
      );
    });

    it('should use a case-insensitive or exact name check via findByName', async () => {
      mockRolesDao.findByName.mockResolvedValue(null);
      mockRolesDao.save.mockResolvedValue(createMockRole());

      await service.create(createDto as any, adminUser);

      expect(mockRolesDao.findByName).toHaveBeenCalledWith(createDto.name);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should throw NotFoundException when role does not exist', async () => {
      mockRolesDao.findById.mockResolvedValue(null);

      await expect(service.update('bad-id', {} as any, adminUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update allowed fields and return role with user count', async () => {
      const role = createMockRole();
      const updated = createMockRole({ label: 'Updated Label' });
      mockRolesDao.findById.mockResolvedValue(role);
      mockRolesDao.update.mockResolvedValue(updated);
      mockUserRepo.count.mockResolvedValue(2);

      const result = await service.update(
        TEST_ROLE_ID,
        { label: 'Updated Label' } as any,
        adminUser,
      );

      expect(result.label).toBe('Updated Label');
      expect(result.user_count).toBe(2);
      expect(mockActivityLogsService.log).toHaveBeenCalled();
    });

    it('should always pass updatedBy even when dto is empty', async () => {
      mockRolesDao.findById.mockResolvedValue(createMockRole());
      mockRolesDao.update.mockResolvedValue(createMockRole());
      mockUserRepo.count.mockResolvedValue(0);

      await service.update(TEST_ROLE_ID, {} as any, adminUser);

      expect(mockRolesDao.update).toHaveBeenCalledWith(
        TEST_ROLE_ID,
        expect.objectContaining({ updatedBy: adminUser.id }),
      );
    });

    it('should ignore name in dto — name field is not updatable', async () => {
      const role = createMockRole();
      mockRolesDao.findById.mockResolvedValue(role);
      mockRolesDao.update.mockResolvedValue(role);
      mockUserRepo.count.mockResolvedValue(0);

      await service.update(TEST_ROLE_ID, { name: 'attempted-rename' } as any, adminUser);

      const updatePayload = mockRolesDao.update.mock.calls[0][1];
      expect(updatePayload).not.toHaveProperty('name');
    });

    it('should include activity log with role name from the pre-update snapshot', async () => {
      const role = createMockRole({ name: 'original-name' });
      mockRolesDao.findById.mockResolvedValue(role);
      mockRolesDao.update.mockResolvedValue(createMockRole({ label: 'New Label' }));
      mockUserRepo.count.mockResolvedValue(0);

      await service.update(TEST_ROLE_ID, { label: 'New Label' } as any, adminUser);

      const logArg = mockActivityLogsService.log.mock.calls[0][0];
      expect(logArg.description).toContain('original-name');
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should throw NotFoundException when role does not exist', async () => {
      mockRolesDao.findById.mockResolvedValue(null);

      await expect(service.remove('bad-id', adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when users are assigned to the role', async () => {
      mockRolesDao.findById.mockResolvedValue(createMockRole());
      mockUserRepo.count.mockResolvedValue(3);

      await expect(service.remove(TEST_ROLE_ID, adminUser)).rejects.toThrow(BadRequestException);
      expect(mockRolesDao.delete).not.toHaveBeenCalled();
    });

    it('should delete the role and log the action when no users assigned', async () => {
      mockRolesDao.findById.mockResolvedValue(createMockRole());
      mockUserRepo.count.mockResolvedValue(0);
      mockRolesDao.delete.mockResolvedValue(undefined);

      const result = await service.remove(TEST_ROLE_ID, adminUser);

      expect(result.message).toBe('Role deleted');
      expect(mockRolesDao.delete).toHaveBeenCalledWith(TEST_ROLE_ID);
      expect(mockActivityLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'delete', entityType: 'role' }),
      );
    });

    it('should include exact user count in the BadRequestException message', async () => {
      mockRolesDao.findById.mockResolvedValue(createMockRole());
      mockUserRepo.count.mockResolvedValue(7);

      await expect(service.remove(TEST_ROLE_ID, adminUser)).rejects.toThrow(/7 user\(s\)/);
    });

    it('should not call delete when role has exactly 1 assigned user', async () => {
      mockRolesDao.findById.mockResolvedValue(createMockRole());
      mockUserRepo.count.mockResolvedValue(1);

      await expect(service.remove(TEST_ROLE_ID, adminUser)).rejects.toThrow(BadRequestException);
      expect(mockRolesDao.delete).not.toHaveBeenCalled();
    });
  });

  // ─── upsertPermissions ────────────────────────────────────────────────────
  describe('upsertPermissions', () => {
    it('should throw NotFoundException when role does not exist', async () => {
      mockRolesDao.findById.mockResolvedValue(null);

      await expect(service.upsertPermissions('bad-id', [], adminUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should upsert permissions and log the action', async () => {
      mockRolesDao.findById.mockResolvedValue(createMockRole());
      const perms = [createMockRolePermission()];
      mockRolesDao.upsertPermissions.mockResolvedValue(perms);

      const entries = [{ moduleId: 'user_management', permissionId: 'view-perm-uuid' }];
      const result = await service.upsertPermissions(TEST_ROLE_ID, entries, adminUser);

      expect(result).toHaveLength(1);
      expect(mockRolesDao.upsertPermissions).toHaveBeenCalledWith(TEST_ROLE_ID, entries);
      expect(mockActivityLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'edit', entityType: 'role_permission' }),
      );
    });

    it('should call DAO upsert with empty array to clear all permissions', async () => {
      mockRolesDao.findById.mockResolvedValue(createMockRole());
      mockRolesDao.upsertPermissions.mockResolvedValue([]);

      const result = await service.upsertPermissions(TEST_ROLE_ID, [], adminUser);

      expect(result).toHaveLength(0);
      expect(mockRolesDao.upsertPermissions).toHaveBeenCalledWith(TEST_ROLE_ID, []);
    });

    it('should include role name in activity log description', async () => {
      const role = createMockRole({ name: 'finance' });
      mockRolesDao.findById.mockResolvedValue(role);
      mockRolesDao.upsertPermissions.mockResolvedValue([]);

      await service.upsertPermissions(TEST_ROLE_ID, [], adminUser);

      const logArg = mockActivityLogsService.log.mock.calls[0][0];
      expect(logArg.description).toContain('finance');
    });

    it('should not call upsertPermissions DAO when role not found', async () => {
      mockRolesDao.findById.mockResolvedValue(null);

      await expect(service.upsertPermissions('bad-id', [], adminUser)).rejects.toThrow();
      expect(mockRolesDao.upsertPermissions).not.toHaveBeenCalled();
    });
  });
});
