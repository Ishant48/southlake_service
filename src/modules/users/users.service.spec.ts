import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersDao } from './dao/users.dao';
import { MailService } from '../mail/mail.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { User } from './entities/user.entity';
import { UserPermission } from './entities/user-permission.entity';
import { PendingInvite } from './entities/pending-invite.entity';

// ─── Test constants ───────────────────────────────────────────────────────────
const TEST_USER_ID = 'user-test-uuid';
const TEST_ROLE_ID = 'role-test-uuid';
const TEST_DATE = new Date('2025-01-01T00:00:00.000Z');
const TEST_EMAIL = 'user@southlake.com';

// ─── Factory functions ────────────────────────────────────────────────────────
const createMockUser = (overrides: Partial<User> = {}): User =>
  ({
    id: TEST_USER_ID,
    email: TEST_EMAIL,
    name: 'Test User',
    status: 'active',
    roleId: TEST_ROLE_ID,
    userType: 'staff',
    isDeleted: false,
    createdAt: TEST_DATE,
    updatedAt: TEST_DATE,
    ...overrides,
  }) as User;

const createMockPermission = (overrides: Partial<UserPermission> = {}): UserPermission =>
  ({
    id: 'perm-uuid',
    userId: TEST_USER_ID,
    moduleId: 'user_management',
    permissionId: 'view-perm-uuid',
    accessType: 'grant',
    createdAt: TEST_DATE,
    ...overrides,
  }) as UserPermission;

const createMockInvite = (overrides: Partial<PendingInvite> = {}): PendingInvite =>
  ({
    id: 'invite-uuid',
    email: 'invited@southlake.com',
    name: 'Invited User',
    token: 'invite-token-abc',
    status: 'pending',
    invitedAt: TEST_DATE,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ...overrides,
  }) as PendingInvite;

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockUsersDao = {
  getStats: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  saveInvite: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  deactivateBulk: jest.fn(),
  findUserPermissions: jest.fn(),
  upsertUserPermissions: jest.fn(),
  findPendingInvites: jest.fn(),
  revokeInvite: jest.fn(),
};

const mockMailService = { sendInvite: jest.fn() };
const mockActivityLogsService = { log: jest.fn() };
const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, unknown> = { 'app.appUrl': 'http://localhost:4200' };
    return config[key];
  }),
};

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('UsersService', () => {
  let service: UsersService;
  const adminUser = createMockUser({ id: 'admin-uuid', email: 'admin@southlake.com' });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersDao, useValue: mockUsersDao },
        { provide: MailService, useValue: mockMailService },
        { provide: ActivityLogsService, useValue: mockActivityLogsService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();

    // Sensible defaults
    mockActivityLogsService.log.mockResolvedValue(undefined);
    mockMailService.sendInvite.mockResolvedValue(undefined);
  });

  // ─── getStats ─────────────────────────────────────────────────────────────
  describe('getStats', () => {
    it('should return stats from the DAO', async () => {
      const stats = { total: 10, active: 8, roles_defined: 3, pending_invites: 1 };
      mockUsersDao.getStats.mockResolvedValue(stats);

      const result = await service.getStats();

      expect(result).toEqual(stats);
      expect(mockUsersDao.getStats).toHaveBeenCalledTimes(1);
    });

    it('should return zeros when no data exists', async () => {
      mockUsersDao.getStats.mockResolvedValue({
        total: 0,
        active: 0,
        roles_defined: 0,
        pending_invites: 0,
      });

      const result = await service.getStats();

      expect(result.total).toBe(0);
      expect(result.active).toBe(0);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated result with correct metadata', async () => {
      const users = [createMockUser(), createMockUser({ id: 'user-2', email: 'user2@test.com' })];
      mockUsersDao.findAll.mockResolvedValue([users, 25]);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(result.data).toBe(users);
      expect(result.total).toBe(25);
      expect(result.page).toBe(2);
      expect(result.per_page).toBe(10);
      expect(result.total_pages).toBe(3);
    });

    it('should default to page 1 and limit 20', async () => {
      mockUsersDao.findAll.mockResolvedValue([[], 0]);

      const result = await service.findAll({});

      expect(result.page).toBe(1);
      expect(result.per_page).toBe(20);
    });

    it('should return total_pages 0 when total is 0', async () => {
      mockUsersDao.findAll.mockResolvedValue([[], 0]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.total_pages).toBe(0);
      expect(result.data).toHaveLength(0);
    });

    it('should round up total_pages for fractional page counts', async () => {
      mockUsersDao.findAll.mockResolvedValue([[], 7]);

      const result = await service.findAll({ page: 1, limit: 3 });

      expect(result.total_pages).toBe(3); // ceil(7/3) = 3
    });

    it('should pass filters to the DAO', async () => {
      mockUsersDao.findAll.mockResolvedValue([[], 0]);

      const filters = {
        page: 1,
        limit: 10,
        status: 'active',
        search: 'john',
        role_id: TEST_ROLE_ID,
      };
      await service.findAll(filters);

      expect(mockUsersDao.findAll).toHaveBeenCalledWith(filters);
    });
  });

  // ─── findOne ──────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return the user when found', async () => {
      const user = createMockUser();
      mockUsersDao.findById.mockResolvedValue(user);

      const result = await service.findOne(TEST_USER_ID);

      expect(result).toBe(user);
      expect(mockUsersDao.findById).toHaveBeenCalledWith(TEST_USER_ID);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUsersDao.findById.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─── invite ───────────────────────────────────────────────────────────────
  describe('invite', () => {
    const inviteDto = {
      email: 'new@southlake.com',
      name: 'New User',
      role_id: TEST_ROLE_ID,
      user_type: 'staff',
    };

    it('should throw BadRequestException when user already exists', async () => {
      mockUsersDao.findByEmail.mockResolvedValue(createMockUser());

      await expect(service.invite(inviteDto as any, adminUser)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockUsersDao.saveInvite).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException even if existing user is inactive', async () => {
      mockUsersDao.findByEmail.mockResolvedValue(createMockUser({ status: 'inactive' }));

      await expect(service.invite(inviteDto as any, adminUser)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should save invite, send email and log activity', async () => {
      mockUsersDao.findByEmail.mockResolvedValue(null);
      mockUsersDao.saveInvite.mockResolvedValue(createMockInvite());

      const result = await service.invite(inviteDto as any, adminUser);

      expect(result.message).toContain(inviteDto.email);
      expect(mockUsersDao.saveInvite).toHaveBeenCalledWith(
        expect.objectContaining({ email: inviteDto.email, invitedBy: adminUser.id }),
      );
      expect(mockMailService.sendInvite).toHaveBeenCalledWith(
        inviteDto.email,
        inviteDto.name,
        expect.stringContaining('accept-invite'),
        adminUser.name,
      );
      expect(mockActivityLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'create', entityType: 'pending_invite' }),
      );
    });

    it('should build invite link using APP_URL from config', async () => {
      mockUsersDao.findByEmail.mockResolvedValue(null);
      mockUsersDao.saveInvite.mockResolvedValue(createMockInvite());

      await service.invite(inviteDto as any, adminUser);

      const [, , inviteLink] = mockMailService.sendInvite.mock.calls[0];
      expect(inviteLink).toMatch(/^http:\/\/localhost:4200\/accept-invite\?token=[a-f0-9]{64}$/);
    });

    it('should default optional fields to null when not provided', async () => {
      const minimalDto = { email: 'min@southlake.com', name: 'Min', role_id: TEST_ROLE_ID };
      mockUsersDao.findByEmail.mockResolvedValue(null);
      mockUsersDao.saveInvite.mockResolvedValue(createMockInvite());

      await service.invite(minimalDto as any, adminUser);

      expect(mockUsersDao.saveInvite).toHaveBeenCalledWith(
        expect.objectContaining({
          userType: null,
          department: null,
          title: null,
        }),
      );
    });

    it('should save with status pending and a future expiry', async () => {
      mockUsersDao.findByEmail.mockResolvedValue(null);
      mockUsersDao.saveInvite.mockResolvedValue(createMockInvite());

      const before = Date.now();
      await service.invite(inviteDto as any, adminUser);
      const after = Date.now();

      const savedArg = mockUsersDao.saveInvite.mock.calls[0][0];
      expect(savedArg.status).toBe('pending');
      expect(savedArg.expiresAt.getTime()).toBeGreaterThan(before + 6 * 24 * 60 * 60 * 1000);
      expect(savedArg.expiresAt.getTime()).toBeLessThan(after + 8 * 24 * 60 * 60 * 1000);
    });
  });

  // ─── update ───────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      mockUsersDao.findById.mockResolvedValue(null);

      await expect(service.update('bad-id', { name: 'X' } as any, adminUser)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUsersDao.update).not.toHaveBeenCalled();
    });

    it('should update allowed fields and return updated user', async () => {
      const original = createMockUser();
      const updated = createMockUser({ name: 'Updated Name' });
      mockUsersDao.findById.mockResolvedValue(original);
      mockUsersDao.update.mockResolvedValue(updated);

      const result = await service.update(TEST_USER_ID, { name: 'Updated Name' } as any, adminUser);

      expect(result.name).toBe('Updated Name');
      expect(mockUsersDao.update).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.objectContaining({ name: 'Updated Name', updatedBy: adminUser.id }),
      );
    });

    it('should not include undefined fields in the update payload', async () => {
      mockUsersDao.findById.mockResolvedValue(createMockUser());
      mockUsersDao.update.mockResolvedValue(createMockUser({ name: 'Only Name' }));

      await service.update(TEST_USER_ID, { name: 'Only Name' } as any, adminUser);

      const updatePayload = mockUsersDao.update.mock.calls[0][1];
      expect(updatePayload).not.toHaveProperty('phone');
      expect(updatePayload).not.toHaveProperty('department');
      expect(updatePayload).not.toHaveProperty('roleId');
    });

    it('should always set updatedBy regardless of other fields', async () => {
      mockUsersDao.findById.mockResolvedValue(createMockUser());
      mockUsersDao.update.mockResolvedValue(createMockUser());

      await service.update(TEST_USER_ID, {} as any, adminUser);

      expect(mockUsersDao.update).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.objectContaining({ updatedBy: adminUser.id }),
      );
    });

    it('should convert joined_date string to Date object', async () => {
      mockUsersDao.findById.mockResolvedValue(createMockUser());
      mockUsersDao.update.mockResolvedValue(createMockUser());

      await service.update(TEST_USER_ID, { joined_date: '2024-06-01' } as any, adminUser);

      const updatePayload = mockUsersDao.update.mock.calls[0][1];
      expect(updatePayload.joinedDate).toBeInstanceOf(Date);
      expect(updatePayload.joinedDate.getFullYear()).toBe(2024);
    });

    it('should map role_id to roleId in the update payload', async () => {
      const newRoleId = 'new-role-uuid';
      mockUsersDao.findById.mockResolvedValue(createMockUser());
      mockUsersDao.update.mockResolvedValue(createMockUser({ roleId: newRoleId }));

      await service.update(TEST_USER_ID, { role_id: newRoleId } as any, adminUser);

      expect(mockUsersDao.update).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.objectContaining({ roleId: newRoleId }),
      );
    });

    it('should log activity with action=edit and entityType=user', async () => {
      mockUsersDao.findById.mockResolvedValue(createMockUser());
      mockUsersDao.update.mockResolvedValue(createMockUser());

      await service.update(TEST_USER_ID, { name: 'X' } as any, adminUser);

      expect(mockActivityLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'edit',
          entityType: 'user',
          entityId: TEST_USER_ID,
          userId: adminUser.id,
        }),
      );
    });
  });

  // ─── updateStatus ─────────────────────────────────────────────────────────
  describe('updateStatus', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      mockUsersDao.findById.mockResolvedValue(null);

      await expect(
        service.updateStatus('bad-id', { status: 'inactive' } as any, adminUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update status and log activity', async () => {
      const user = createMockUser();
      const updated = createMockUser({ status: 'inactive' });
      mockUsersDao.findById.mockResolvedValue(user);
      mockUsersDao.update.mockResolvedValue(updated);

      const result = await service.updateStatus(
        TEST_USER_ID,
        { status: 'inactive' } as any,
        adminUser,
      );

      expect(result.status).toBe('inactive');
      expect(mockActivityLogsService.log).toHaveBeenCalled();
    });

    it('should pass exact status value and updatedBy to DAO', async () => {
      mockUsersDao.findById.mockResolvedValue(createMockUser());
      mockUsersDao.update.mockResolvedValue(createMockUser({ status: 'active' }));

      await service.updateStatus(TEST_USER_ID, { status: 'active' } as any, adminUser);

      expect(mockUsersDao.update).toHaveBeenCalledWith(TEST_USER_ID, {
        status: 'active',
        updatedBy: adminUser.id,
      });
    });

    it('should include status value in activity log description', async () => {
      mockUsersDao.findById.mockResolvedValue(createMockUser());
      mockUsersDao.update.mockResolvedValue(createMockUser({ status: 'inactive' }));

      await service.updateStatus(TEST_USER_ID, { status: 'inactive' } as any, adminUser);

      const logArg = mockActivityLogsService.log.mock.calls[0][0];
      expect(logArg.description).toContain('inactive');
    });

    it('should not call DAO update when findById throws', async () => {
      mockUsersDao.findById.mockResolvedValue(null);

      await expect(
        service.updateStatus('bad-id', { status: 'inactive' } as any, adminUser),
      ).rejects.toThrow(NotFoundException);
      expect(mockUsersDao.update).not.toHaveBeenCalled();
    });
  });

  // ─── deactivate ───────────────────────────────────────────────────────────
  describe('deactivate', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      mockUsersDao.findById.mockResolvedValue(null);

      await expect(service.deactivate('bad-id', adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should set status to inactive and return success message', async () => {
      mockUsersDao.findById.mockResolvedValue(createMockUser());
      mockUsersDao.update.mockResolvedValue(createMockUser({ status: 'inactive' }));

      const result = await service.deactivate(TEST_USER_ID, adminUser);

      expect(result.message).toBe('User deactivated');
      expect(mockUsersDao.update).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.objectContaining({ status: 'inactive' }),
      );
    });

    it('should always pass status=inactive (not determined by caller)', async () => {
      mockUsersDao.findById.mockResolvedValue(createMockUser());
      mockUsersDao.update.mockResolvedValue(createMockUser());

      await service.deactivate(TEST_USER_ID, adminUser);

      const updatePayload = mockUsersDao.update.mock.calls[0][1];
      expect(updatePayload.status).toBe('inactive');
    });

    it('should log activity with action=edit and correct userId', async () => {
      mockUsersDao.findById.mockResolvedValue(createMockUser());
      mockUsersDao.update.mockResolvedValue(createMockUser());

      await service.deactivate(TEST_USER_ID, adminUser);

      expect(mockActivityLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'edit',
          entityType: 'user',
          entityId: TEST_USER_ID,
          userId: adminUser.id,
        }),
      );
    });
  });

  // ─── remove ───────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      mockUsersDao.findById.mockResolvedValue(null);

      await expect(service.remove('bad-id', adminUser)).rejects.toThrow(NotFoundException);
    });

    it('should soft delete the user and log the action', async () => {
      mockUsersDao.findById.mockResolvedValue(createMockUser());
      mockUsersDao.softDelete.mockResolvedValue(undefined);

      const result = await service.remove(TEST_USER_ID, adminUser);

      expect(result.message).toBe('User deleted');
      expect(mockUsersDao.softDelete).toHaveBeenCalledWith(TEST_USER_ID, adminUser.id);
      expect(mockActivityLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'delete', entityType: 'user' }),
      );
    });
  });

  // ─── deactivateBulk ───────────────────────────────────────────────────────
  describe('deactivateBulk', () => {
    it('should bulk deactivate users and return count', async () => {
      const ids = ['id-1', 'id-2', 'id-3'];
      mockUsersDao.deactivateBulk.mockResolvedValue(undefined);

      const result = await service.deactivateBulk(ids, adminUser);

      expect(result.count).toBe(3);
      expect(result.message).toContain('3');
      expect(mockUsersDao.deactivateBulk).toHaveBeenCalledWith(ids, adminUser.id);
    });

    it('should return count=0 and call DAO when given empty array', async () => {
      mockUsersDao.deactivateBulk.mockResolvedValue(undefined);

      const result = await service.deactivateBulk([], adminUser);

      expect(result.count).toBe(0);
      expect(result.message).toContain('0');
      expect(mockUsersDao.deactivateBulk).toHaveBeenCalledWith([], adminUser.id);
    });

    it('should include the exact count in the activity log description', async () => {
      mockUsersDao.deactivateBulk.mockResolvedValue(undefined);

      await service.deactivateBulk(['a', 'b'], adminUser);

      const logArg = mockActivityLogsService.log.mock.calls[0][0];
      expect(logArg.description).toContain('2');
    });

    it('should NOT call findById — no per-user validation before bulk op', async () => {
      mockUsersDao.deactivateBulk.mockResolvedValue(undefined);

      await service.deactivateBulk(['id-1', 'id-2'], adminUser);

      expect(mockUsersDao.findById).not.toHaveBeenCalled();
    });
  });

  // ─── upsertPermissions ────────────────────────────────────────────────────
  describe('upsertPermissions', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      mockUsersDao.findById.mockResolvedValue(null);

      await expect(service.upsertPermissions('bad-id', [], adminUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should upsert permissions and return the result', async () => {
      mockUsersDao.findById.mockResolvedValue(createMockUser());
      const perms = [createMockPermission()];
      mockUsersDao.upsertUserPermissions.mockResolvedValue(perms);

      const entries = [
        { moduleId: 'user_management', permissionId: 'perm-uuid', accessType: 'grant' as const },
      ];
      const result = await service.upsertPermissions(TEST_USER_ID, entries, adminUser);

      expect(result).toHaveLength(1);
      expect(mockUsersDao.upsertUserPermissions).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.arrayContaining([expect.objectContaining({ createdBy: adminUser.id })]),
      );
    });

    it('should inject createdBy into every permission entry', async () => {
      mockUsersDao.findById.mockResolvedValue(createMockUser());
      mockUsersDao.upsertUserPermissions.mockResolvedValue([]);

      const entries = [
        { moduleId: 'm1', permissionId: 'p1', accessType: 'grant' as const },
        { moduleId: 'm2', permissionId: 'p2', accessType: 'revoke' as const },
      ];
      await service.upsertPermissions(TEST_USER_ID, entries, adminUser);

      const savedEntries = mockUsersDao.upsertUserPermissions.mock.calls[0][1];
      expect(savedEntries).toHaveLength(2);
      savedEntries.forEach((e: any) => expect(e.createdBy).toBe(adminUser.id));
    });

    it('should call DAO with empty array when clearing all permissions', async () => {
      mockUsersDao.findById.mockResolvedValue(createMockUser());
      mockUsersDao.upsertUserPermissions.mockResolvedValue([]);

      const result = await service.upsertPermissions(TEST_USER_ID, [], adminUser);

      expect(result).toHaveLength(0);
      expect(mockUsersDao.upsertUserPermissions).toHaveBeenCalledWith(TEST_USER_ID, []);
    });

    it('should support revoke accessType', async () => {
      mockUsersDao.findById.mockResolvedValue(createMockUser());
      mockUsersDao.upsertUserPermissions.mockResolvedValue([
        createMockPermission({ accessType: 'revoke' as any }),
      ]);

      const entries = [
        { moduleId: 'user_management', permissionId: 'perm-uuid', accessType: 'revoke' as const },
      ];
      const result = await service.upsertPermissions(TEST_USER_ID, entries, adminUser);

      expect(result[0].accessType).toBe('revoke');
    });

    it('should log with entityType=user_permission and entityId=userId', async () => {
      mockUsersDao.findById.mockResolvedValue(createMockUser());
      mockUsersDao.upsertUserPermissions.mockResolvedValue([]);

      await service.upsertPermissions(TEST_USER_ID, [], adminUser);

      expect(mockActivityLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'edit',
          entityType: 'user_permission',
          entityId: TEST_USER_ID,
        }),
      );
    });
  });

  // ─── getPermissions ───────────────────────────────────────────────────────
  describe('getPermissions', () => {
    it('should delegate directly to DAO without any guard', async () => {
      const perms = [createMockPermission(), createMockPermission({ id: 'perm-2' })];
      mockUsersDao.findUserPermissions.mockResolvedValue(perms);

      const result = await service.getPermissions(TEST_USER_ID);

      expect(result).toBe(perms);
      expect(mockUsersDao.findUserPermissions).toHaveBeenCalledWith(TEST_USER_ID);
      expect(mockUsersDao.findById).not.toHaveBeenCalled();
    });

    it('should return empty array when user has no permission overrides', async () => {
      mockUsersDao.findUserPermissions.mockResolvedValue([]);

      const result = await service.getPermissions(TEST_USER_ID);

      expect(result).toEqual([]);
    });
  });

  // ─── getPendingInvites ────────────────────────────────────────────────────
  describe('getPendingInvites', () => {
    it('should delegate directly to DAO and return invites', async () => {
      const invites = [createMockInvite(), createMockInvite({ id: 'invite-2' })];
      mockUsersDao.findPendingInvites.mockResolvedValue(invites);

      const result = await service.getPendingInvites();

      expect(result).toBe(invites);
      expect(mockUsersDao.findPendingInvites).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no pending invites exist', async () => {
      mockUsersDao.findPendingInvites.mockResolvedValue([]);

      const result = await service.getPendingInvites();

      expect(result).toEqual([]);
    });
  });

  // ─── revokeInvite ─────────────────────────────────────────────────────────
  describe('revokeInvite', () => {
    it('should revoke the invite and log the action', async () => {
      mockUsersDao.revokeInvite.mockResolvedValue(undefined);

      const result = await service.revokeInvite('invite-uuid', adminUser);

      expect(result.message).toBe('Invite revoked');
      expect(mockUsersDao.revokeInvite).toHaveBeenCalledWith('invite-uuid');
      expect(mockActivityLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'delete', entityType: 'pending_invite' }),
      );
    });

    it('should NOT call findById — no ownership check on invite', async () => {
      mockUsersDao.revokeInvite.mockResolvedValue(undefined);

      await service.revokeInvite('invite-uuid', adminUser);

      expect(mockUsersDao.findById).not.toHaveBeenCalled();
    });

    it('should log with correct entityId matching the invite id', async () => {
      const inviteId = 'specific-invite-uuid';
      mockUsersDao.revokeInvite.mockResolvedValue(undefined);

      await service.revokeInvite(inviteId, adminUser);

      expect(mockActivityLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({ entityId: inviteId }),
      );
    });
  });
});
