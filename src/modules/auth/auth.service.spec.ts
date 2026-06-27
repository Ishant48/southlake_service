import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { AuthDao } from './dao/auth.dao';
import { CommunicationService } from '../../common/communication/communication.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { User } from '../users/entities/user.entity';
import { LoginOtp } from './entities/login-otp.entity';
import { UserSession } from './entities/user-session.entity';
import { LoginChallenge } from './entities/login-challenge.entity';

// ─── Test constants ─────────────────────────────────────────────────────────
const TEST_USER_ID = 'user-test-uuid';
const TEST_ROLE_ID = 'role-test-uuid';
const TEST_SESSION_ID = 'session-test-uuid';
const TEST_OTP_ID = 'otp-test-uuid';
const TEST_DATE = new Date('2025-01-01T00:00:00.000Z');
const TEST_EMAIL = 'test@southlake.com';

// ─── Factory functions ───────────────────────────────────────────────────────
const createMockUser = (overrides: Partial<User> = {}): User =>
  ({
    id: TEST_USER_ID,
    email: TEST_EMAIL,
    name: 'Test User',
    status: 'active',
    roleId: TEST_ROLE_ID,
    userType: 'staff',
    isDeleted: false,
    passwordHash: null,
    createdAt: TEST_DATE,
    updatedAt: TEST_DATE,
    ...overrides,
  }) as User;

const createMockOtp = (overrides: Partial<LoginOtp> = {}): LoginOtp =>
  ({
    id: TEST_OTP_ID,
    email: TEST_EMAIL,
    otpHash: '$2a$10$placeholder',
    attemptCount: 0,
    isUsed: false,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    createdAt: TEST_DATE,
    ...overrides,
  }) as LoginOtp;

const createMockSession = (overrides: Partial<UserSession> = {}): UserSession =>
  ({
    id: TEST_SESSION_ID,
    userId: TEST_USER_ID,
    sessionToken: 'session-token-abc',
    isActive: true,
    deviceLabel: 'Chrome/Test',
    ipAddress: '127.0.0.1',
    userAgent: 'jest',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    createdAt: TEST_DATE,
    ...overrides,
  }) as UserSession;

const createMockChallenge = (overrides: Partial<LoginChallenge> = {}): LoginChallenge =>
  ({
    id: 'challenge-uuid',
    userId: TEST_USER_ID,
    challengeToken: 'challenge-token-abc',
    existingSessionId: TEST_SESSION_ID,
    status: 'pending',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    createdAt: TEST_DATE,
    ...overrides,
  }) as LoginChallenge;

// ─── Mocks ───────────────────────────────────────────────────────────────────
const mockAuthDao = {
  findUserWithPasswordByEmail: jest.fn(),
  findUserByEmail: jest.fn(),
  findUserById: jest.fn(),
  countRecentOtps: jest.fn(),
  saveOtp: jest.fn(),
  findActiveOtp: jest.fn(),
  markOtpUsed: jest.fn(),
  incrementOtpAttempt: jest.fn(),
  updateUserLastLogin: jest.fn(),
  findActiveSessionForUser: jest.fn(),
  saveSession: jest.fn(),
  revokeSession: jest.fn(),
  findSessionById: jest.fn(),
  saveChallenge: jest.fn(),
  findChallenge: jest.fn(),
  resolveChallenge: jest.fn(),
};

const mockCommunicationService = {
  sendOtp: jest.fn(),
  sendInvite: jest.fn(),
};

const mockActivityLogsService = {
  log: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, unknown> = {
      'app.otpExpiryMinutes': 5,
      'app.otpMaxAttempts': 5,
      'app.sessionExpiryHours': 1,
    };
    return config[key];
  }),
};

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthDao, useValue: mockAuthDao },
        { provide: CommunicationService, useValue: mockCommunicationService },
        { provide: ActivityLogsService, useValue: mockActivityLogsService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();

    // Sensible defaults
    mockAuthDao.saveOtp.mockResolvedValue(createMockOtp());
    mockAuthDao.saveSession.mockResolvedValue(createMockSession());
    mockAuthDao.findActiveSessionForUser.mockResolvedValue(null);
    mockAuthDao.countRecentOtps.mockResolvedValue(0);
    mockActivityLogsService.log.mockResolvedValue(undefined);
    mockCommunicationService.sendOtp.mockResolvedValue(undefined);
  });

  // ─── login ────────────────────────────────────────────────────────────────
  describe('login', () => {
    it('should throw UnauthorizedException when user is not found', async () => {
      mockAuthDao.findUserWithPasswordByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: TEST_EMAIL, password: 'pass' }, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockAuthDao.saveOtp).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user has no passwordHash', async () => {
      mockAuthDao.findUserWithPasswordByEmail.mockResolvedValue(
        createMockUser({ passwordHash: null }),
      );

      await expect(
        service.login({ email: TEST_EMAIL, password: 'pass' }, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      mockAuthDao.findUserWithPasswordByEmail.mockResolvedValue(
        createMockUser({ passwordHash: hash }),
      );

      await expect(
        service.login({ email: TEST_EMAIL, password: 'wrong-password' }, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const hash = await bcrypt.hash('pass', 10);
      mockAuthDao.findUserWithPasswordByEmail.mockResolvedValue(
        createMockUser({ status: 'inactive', passwordHash: hash }),
      );

      await expect(
        service.login({ email: TEST_EMAIL, password: 'pass' }, '127.0.0.1'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when OTP rate limit is exceeded', async () => {
      const hash = await bcrypt.hash('pass', 10);
      mockAuthDao.findUserWithPasswordByEmail.mockResolvedValue(
        createMockUser({ passwordHash: hash }),
      );
      mockAuthDao.countRecentOtps.mockResolvedValue(3);

      await expect(
        service.login({ email: TEST_EMAIL, password: 'pass' }, '127.0.0.1'),
      ).rejects.toThrow(BadRequestException);
      expect(mockAuthDao.saveOtp).not.toHaveBeenCalled();
    });

    it('should save OTP, send email and return success message on valid credentials', async () => {
      const hash = await bcrypt.hash('pass', 10);
      mockAuthDao.findUserWithPasswordByEmail.mockResolvedValue(
        createMockUser({ passwordHash: hash }),
      );

      const result = await service.login({ email: TEST_EMAIL, password: 'pass' }, '127.0.0.1');

      expect(result).toEqual({ message: 'OTP sent to your email.' });
      expect(mockAuthDao.saveOtp).toHaveBeenCalledWith(
        expect.objectContaining({ email: TEST_EMAIL }),
      );
      expect(mockCommunicationService.sendOtp).toHaveBeenCalledWith({
        to: TEST_EMAIL,
        otp: expect.any(String),
      });
      expect(mockActivityLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'otp_requested' }),
      );
    });
  });

  // ─── verifyOtp ────────────────────────────────────────────────────────────
  describe('verifyOtp', () => {
    const verifyDto = { email: TEST_EMAIL, otp: '123456', device_label: 'Chrome' };
    const ip = '127.0.0.1';
    const ua = 'Mozilla/5.0';

    it('should throw UnauthorizedException when no active OTP record found', async () => {
      mockAuthDao.findActiveOtp.mockResolvedValue(null);

      await expect(service.verifyOtp(verifyDto, ip, ua)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when max OTP attempts are exceeded', async () => {
      mockAuthDao.findActiveOtp.mockResolvedValue(createMockOtp({ attemptCount: 5 }));

      await expect(service.verifyOtp(verifyDto, ip, ua)).rejects.toThrow(UnauthorizedException);
      expect(mockAuthDao.incrementOtpAttempt).not.toHaveBeenCalled();
    });

    it('should increment attempt count and throw UnauthorizedException on wrong OTP', async () => {
      const hash = await bcrypt.hash('654321', 10);
      mockAuthDao.findActiveOtp.mockResolvedValue(createMockOtp({ otpHash: hash }));
      mockAuthDao.incrementOtpAttempt.mockResolvedValue(undefined);

      await expect(service.verifyOtp(verifyDto, ip, ua)).rejects.toThrow(UnauthorizedException);
      expect(mockAuthDao.incrementOtpAttempt).toHaveBeenCalled();
    });

    it('should return session token when OTP is correct and no existing session', async () => {
      const hash = await bcrypt.hash('123456', 10);
      mockAuthDao.findActiveOtp.mockResolvedValue(createMockOtp({ otpHash: hash }));
      mockAuthDao.markOtpUsed.mockResolvedValue(undefined);
      mockAuthDao.findUserByEmail.mockResolvedValue(createMockUser());
      mockAuthDao.updateUserLastLogin.mockResolvedValue(undefined);

      const result = await service.verifyOtp(verifyDto, ip, ua);

      expect(result['token_type']).toBe('session');
      expect(result['session_token']).toBe('session-token-abc');
      expect(mockAuthDao.markOtpUsed).toHaveBeenCalled();
      expect(mockAuthDao.saveSession).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when verified user is inactive', async () => {
      const hash = await bcrypt.hash('123456', 10);
      mockAuthDao.findActiveOtp.mockResolvedValue(createMockOtp({ otpHash: hash }));
      mockAuthDao.markOtpUsed.mockResolvedValue(undefined);
      mockAuthDao.findUserByEmail.mockResolvedValue(createMockUser({ status: 'inactive' }));

      await expect(service.verifyOtp(verifyDto, ip, ua)).rejects.toThrow(UnauthorizedException);
    });

    it('should return challenge token when existing session is active', async () => {
      const hash = await bcrypt.hash('123456', 10);
      mockAuthDao.findActiveOtp.mockResolvedValue(createMockOtp({ otpHash: hash }));
      mockAuthDao.markOtpUsed.mockResolvedValue(undefined);
      mockAuthDao.findUserByEmail.mockResolvedValue(createMockUser());
      mockAuthDao.updateUserLastLogin.mockResolvedValue(undefined);
      mockAuthDao.findActiveSessionForUser.mockResolvedValue(createMockSession());
      mockAuthDao.saveChallenge.mockResolvedValue(createMockChallenge());

      const result = await service.verifyOtp(verifyDto, ip, ua);

      expect(result['token_type']).toBe('challenge');
      expect(result).toHaveProperty('challenge_token');
      expect(mockAuthDao.saveChallenge).toHaveBeenCalled();
      expect(mockAuthDao.saveSession).not.toHaveBeenCalled();
    });
  });

  // ─── resolveChallenge ─────────────────────────────────────────────────────
  describe('resolveChallenge', () => {
    const ip = '127.0.0.1';
    const ua = 'Mozilla/5.0';

    it('should throw NotFoundException when challenge not found', async () => {
      mockAuthDao.findChallenge.mockResolvedValue(null);

      await expect(
        service.resolveChallenge({ challenge_token: 'bad-token', accept: true }, ip, ua),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw UnauthorizedException when challenge is expired', async () => {
      const expired = createMockChallenge({ expiresAt: new Date(Date.now() - 1000) });
      mockAuthDao.findChallenge.mockResolvedValue(expired);
      mockAuthDao.resolveChallenge.mockResolvedValue(undefined);

      await expect(
        service.resolveChallenge({ challenge_token: 'token', accept: true }, ip, ua),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockAuthDao.resolveChallenge).toHaveBeenCalledWith(expired, 'expired');
    });

    it('should mark challenge rejected and return message when accept=false', async () => {
      mockAuthDao.findChallenge.mockResolvedValue(createMockChallenge());
      mockAuthDao.resolveChallenge.mockResolvedValue(undefined);

      const result = await service.resolveChallenge(
        { challenge_token: 'token', accept: false },
        ip,
        ua,
      );

      expect(result['message']).toContain('rejected');
      expect(mockAuthDao.resolveChallenge).toHaveBeenCalledWith(expect.anything(), 'rejected');
    });

    it('should revoke existing session and create new one when accept=true', async () => {
      const challenge = createMockChallenge();
      const existingSession = createMockSession();

      mockAuthDao.findChallenge.mockResolvedValue(challenge);
      mockAuthDao.findSessionById.mockResolvedValue(existingSession);
      mockAuthDao.revokeSession.mockResolvedValue(undefined);
      mockAuthDao.findUserById.mockResolvedValue(createMockUser());
      mockAuthDao.resolveChallenge.mockResolvedValue(undefined);

      const result = await service.resolveChallenge(
        { challenge_token: 'token', accept: true },
        ip,
        ua,
      );

      expect(result).toHaveProperty('session_token');
      expect(mockAuthDao.revokeSession).toHaveBeenCalledWith(existingSession, 'displaced');
      expect(mockAuthDao.resolveChallenge).toHaveBeenCalledWith(challenge, 'accepted');
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('should revoke the session and log the action', async () => {
      const session = createMockSession();
      mockAuthDao.revokeSession.mockResolvedValue(undefined);

      const result = await service.logout(session);

      expect(result).toEqual({ message: 'Logged out successfully' });
      expect(mockAuthDao.revokeSession).toHaveBeenCalledWith(session, 'logout');
      expect(mockActivityLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'logout', userId: TEST_USER_ID }),
      );
    });
  });

  // ─── getMe ────────────────────────────────────────────────────────────────
  describe('getMe', () => {
    it('should return user fetched by email', async () => {
      const user = createMockUser();
      mockAuthDao.findUserByEmail.mockResolvedValue(user);

      const result = await service.getMe(user);

      expect(result).toBe(user);
      expect(mockAuthDao.findUserByEmail).toHaveBeenCalledWith(TEST_EMAIL);
    });
  });
});
