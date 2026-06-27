import { Test, TestingModule } from '@nestjs/testing';
import { ActivityLogsService, LogEntry } from './activity-logs.service';
import { ActivityLogsDao } from './dao/activity-logs.dao';
import { ActivityLog } from './entities/activity-log.entity';

// ─── Test constants ───────────────────────────────────────────────────────────
const TEST_LOG_ID = 'log-test-uuid';
const TEST_USER_ID = 'user-test-uuid';
const TEST_DATE = new Date('2025-01-01T00:00:00.000Z');

// ─── Factory functions ────────────────────────────────────────────────────────
const createMockLog = (overrides: Partial<ActivityLog> = {}): ActivityLog =>
  ({
    id: TEST_LOG_ID,
    userId: TEST_USER_ID,
    moduleId: 'user_management',
    action: 'create',
    entityType: 'user',
    entityId: 'entity-uuid',
    description: 'Created something',
    ipAddress: '127.0.0.1',
    userAgent: 'jest',
    createdAt: TEST_DATE,
    ...overrides,
  }) as ActivityLog;

const createLogEntry = (overrides: Partial<LogEntry> = {}): LogEntry => ({
  action: 'create',
  ...overrides,
});

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockActivityLogsDao = {
  save: jest.fn(),
  findAll: jest.fn(),
  findAllForExport: jest.fn(),
};

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('ActivityLogsService', () => {
  let service: ActivityLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivityLogsService, { provide: ActivityLogsDao, useValue: mockActivityLogsDao }],
    }).compile();

    service = module.get<ActivityLogsService>(ActivityLogsService);
    jest.clearAllMocks();
  });

  // ─── log ──────────────────────────────────────────────────────────────────
  describe('log', () => {
    it('should pass all entry fields to the DAO', async () => {
      const entry = createLogEntry({
        userId: TEST_USER_ID,
        moduleId: 'user_management',
        action: 'edit',
        entityType: 'user',
        entityId: 'entity-uuid',
        description: 'Updated user',
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome',
      });
      mockActivityLogsDao.save.mockResolvedValue(createMockLog());

      await service.log(entry);

      expect(mockActivityLogsDao.save).toHaveBeenCalledWith({
        userId: TEST_USER_ID,
        moduleId: 'user_management',
        submoduleId: null,
        action: 'edit',
        entityType: 'user',
        entityId: 'entity-uuid',
        description: 'Updated user',
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome',
      });
    });

    it('should default optional fields to null when not provided', async () => {
      mockActivityLogsDao.save.mockResolvedValue(createMockLog());

      await service.log({ action: 'logout' });

      expect(mockActivityLogsDao.save).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: null,
          moduleId: null,
          description: null,
          ipAddress: null,
        }),
      );
    });

    it('should return the saved log entry', async () => {
      const log = createMockLog();
      mockActivityLogsDao.save.mockResolvedValue(log);

      const result = await service.log({ action: 'create' });

      expect(result).toBe(log);
    });
  });

  // ─── findAll ──────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return paginated logs with correct metadata', async () => {
      const logs = [createMockLog(), createMockLog({ id: 'log-2' })];
      mockActivityLogsDao.findAll.mockResolvedValue([logs, 50]);

      const result = await service.findAll({ page: 2, limit: 10 });

      expect(result.data).toBe(logs);
      expect(result.total).toBe(50);
      expect(result.page).toBe(2);
      expect(result.per_page).toBe(10);
      expect(result.total_pages).toBe(5);
    });

    it('should default to page 1 and per_page 20', async () => {
      mockActivityLogsDao.findAll.mockResolvedValue([[], 0]);

      const result = await service.findAll({});

      expect(result.page).toBe(1);
      expect(result.per_page).toBe(20);
    });
  });

  // ─── exportCsv ────────────────────────────────────────────────────────────
  describe('exportCsv', () => {
    it('should return CSV string with header and rows', async () => {
      const log = createMockLog({
        user: { name: 'John Doe', email: 'john@test.com' } as any,
        action: 'create',
        moduleId: 'user_management',
        description: 'Created user',
        ipAddress: '127.0.0.1',
      });
      mockActivityLogsDao.findAllForExport.mockResolvedValue([log]);

      const csv = await service.exportCsv({});

      const lines = csv.split('\n');
      expect(lines[0]).toContain('Date');
      expect(lines[0]).toContain('User');
      expect(lines[0]).toContain('Action');
      expect(lines[1]).toContain('John Doe');
      expect(lines[1]).toContain('create');
    });

    it('should escape commas in description field', async () => {
      const log = createMockLog({
        description: 'Updated name, email, and phone',
        user: null,
      });
      mockActivityLogsDao.findAllForExport.mockResolvedValue([log]);

      const csv = await service.exportCsv({});
      const lines = csv.split('\n');
      // commas replaced with semicolons in description
      expect(lines[1]).toContain('Updated name; email; and phone');
    });

    it('should return only header when no logs exist', async () => {
      mockActivityLogsDao.findAllForExport.mockResolvedValue([]);

      const csv = await service.exportCsv({});

      expect(csv.split('\n')).toHaveLength(1);
    });
  });
});
