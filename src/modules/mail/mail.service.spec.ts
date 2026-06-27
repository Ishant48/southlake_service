import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';

// ─── Mock nodemailer ─────────────────────────────────────────────────────────
const mockTransporter = { sendMail: jest.fn() };

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => mockTransporter),
}));

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, unknown> = {
      'mail.host': 'smtp.test.local',
      'mail.port': 1025,
      'mail.user': '',
      'mail.password': '',
      'mail.from': '"Southlake Test" <noreply@test.local>',
    };
    return config[key];
  }),
};

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService, { provide: ConfigService, useValue: mockConfigService }],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  // ─── sendOtp ──────────────────────────────────────────────────────────────
  describe('sendOtp', () => {
    it('should call sendMail with recipient and OTP subject', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-1' });

      await service.sendOtp('user@test.com', '123456');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@test.com',
          subject: expect.stringContaining('Login Code'),
          html: expect.stringContaining('123456'),
        }),
      );
    });

    it('should include OTP in the email body', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-2' });

      await service.sendOtp('user@test.com', '999888');

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain('999888');
    });

    it('should not throw when sendMail fails (graceful degradation)', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP connection refused'));

      await expect(service.sendOtp('user@test.com', '123456')).resolves.not.toThrow();
    });
  });

  // ─── sendInvite ───────────────────────────────────────────────────────────
  describe('sendInvite', () => {
    it('should call sendMail with recipient, subject and invite link', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'msg-3' });

      await service.sendInvite(
        'new@test.com',
        'John Doe',
        'http://app/accept-invite?token=abc',
        'Admin User',
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'new@test.com',
          subject: expect.stringContaining('invited'),
        }),
      );

      const call = mockTransporter.sendMail.mock.calls[0][0];
      expect(call.html).toContain('http://app/accept-invite?token=abc');
      expect(call.html).toContain('John Doe');
      expect(call.html).toContain('Admin User');
    });

    it('should not throw when sendMail fails (graceful degradation)', async () => {
      mockTransporter.sendMail.mockRejectedValue(new Error('Authentication failed'));

      await expect(
        service.sendInvite('new@test.com', 'John', 'http://invite', 'Admin'),
      ).resolves.not.toThrow();
    });
  });
});
