import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { AuthDao } from './dao/auth.dao';
import { MailService } from '../mail/mail.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResolveChallengeDto } from './dto/resolve-challenge.dto';
import { UserSession } from '../../entities/user-session.entity';
import { User } from '../../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly authDao: AuthDao,
    private readonly mailService: MailService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly configService: ConfigService,
  ) {}

  async requestOtp(dto: RequestOtpDto, ipAddress: string): Promise<{ message: string }> {
    const { email } = dto;

    const rateLimitWindow = new Date(Date.now() - 15 * 60 * 1000);
    const recentCount = await this.authDao.countRecentOtps(email, rateLimitWindow);

    if (recentCount >= 3) {
      throw new BadRequestException('Too many OTP requests. Please wait 15 minutes.');
    }

    const otpExpiryMinutes = this.configService.get<number>('app.otpExpiryMinutes') || 5;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + otpExpiryMinutes * 60 * 1000);

    await this.authDao.saveOtp({ email, otpHash, expiresAt });

    await this.mailService.sendOtp(email, otp);

    await this.activityLogsService.log({
      action: 'otp_requested',
      description: `OTP requested for ${email}`,
      ipAddress,
    });

    return { message: 'OTP sent' };
  }

  async verifyOtp(
    dto: VerifyOtpDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<Record<string, unknown>> {
    const { email, otp, device_label } = dto;
    const maxAttempts = this.configService.get<number>('app.otpMaxAttempts') || 5;

    const otpRecord = await this.authDao.findActiveOtp(email);

    if (!otpRecord) {
      throw new UnauthorizedException('No valid OTP found. Please request a new one.');
    }

    if (otpRecord.attemptCount >= maxAttempts) {
      throw new UnauthorizedException(
        'Maximum OTP attempts exceeded. Please request a new one.',
      );
    }

    const isMatch = await bcrypt.compare(otp, otpRecord.otpHash);

    if (!isMatch) {
      await this.authDao.incrementOtpAttempt(otpRecord);
      throw new UnauthorizedException('Invalid OTP.');
    }

    await this.authDao.markOtpUsed(otpRecord);

    const user = await this.authDao.findUserByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Your account is inactive.');
    }

    await this.authDao.updateUserLastLogin(user.id);

    const existingSession = await this.authDao.findActiveSessionForUser(user.id);

    if (existingSession) {
      const challengeToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await this.authDao.saveChallenge({
        userId: user.id,
        challengeToken,
        existingSessionId: existingSession.id,
        newDeviceLabel: device_label || null,
        newIpAddress: ipAddress,
        newUserAgent: userAgent,
        expiresAt,
      });

      await this.activityLogsService.log({
        userId: user.id,
        action: 'session_conflict_detected',
        description: `Session conflict detected for ${email}`,
        ipAddress,
        userAgent,
      });

      return {
        token_type: 'challenge',
        challenge_token: challengeToken,
        existing_device: {
          label: existingSession.deviceLabel,
          ip: existingSession.ipAddress,
          created_at: existingSession.createdAt,
        },
      };
    }

    const session = await this.createSession(user, device_label || null, ipAddress, userAgent);

    await this.activityLogsService.log({
      userId: user.id,
      action: 'login',
      description: `User ${email} logged in`,
      ipAddress,
      userAgent,
    });

    return {
      token_type: 'session',
      session_token: session.sessionToken,
      user: this.sanitizeUser(user),
    };
  }

  async resolveChallenge(
    dto: ResolveChallengeDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<Record<string, unknown>> {
    const { challenge_token, accept } = dto;

    const challenge = await this.authDao.findChallenge(challenge_token);

    if (!challenge) {
      throw new NotFoundException('Challenge not found or already resolved.');
    }

    if (new Date() > challenge.expiresAt) {
      await this.authDao.resolveChallenge(challenge, 'expired');
      throw new UnauthorizedException('Challenge has expired.');
    }

    if (!accept) {
      await this.authDao.resolveChallenge(challenge, 'rejected');

      await this.activityLogsService.log({
        userId: challenge.userId,
        action: 'session_conflict_rejected',
        description: 'Login challenge rejected',
        ipAddress,
        userAgent,
      });

      return { message: 'Challenge rejected. Your existing session remains active.' };
    }

    const existingSession = await this.authDao.findSessionById(challenge.existingSessionId);
    if (existingSession) {
      await this.authDao.revokeSession(existingSession, 'displaced');
    }

    const user = await this.authDao.findUserById(challenge.userId);

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const session = await this.createSession(
      user,
      challenge.newDeviceLabel,
      challenge.newIpAddress,
      challenge.newUserAgent,
    );

    await this.authDao.resolveChallenge(challenge, 'accepted');

    await this.activityLogsService.log({
      userId: user.id,
      action: 'session_conflict_accepted',
      description: 'Login challenge accepted; existing session displaced',
      ipAddress,
      userAgent,
    });

    return {
      session_token: session.sessionToken,
      user: this.sanitizeUser(user),
    };
  }

  async logout(session: UserSession): Promise<{ message: string }> {
    await this.authDao.revokeSession(session, 'logout');

    await this.activityLogsService.log({
      userId: session.userId,
      action: 'logout',
      description: 'User logged out',
    });

    return { message: 'Logged out successfully' };
  }

  async getMe(user: User): Promise<User> {
    return this.authDao.findUserByEmail(user.email);
  }

  private async createSession(
    user: User,
    deviceLabel: string | null,
    ipAddress: string,
    userAgent: string,
  ): Promise<UserSession> {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const sessionExpiryHours =
      this.configService.get<number>('app.sessionExpiryHours') || 24;
    const expiresAt = new Date(Date.now() + sessionExpiryHours * 60 * 60 * 1000);

    return this.authDao.saveSession({
      userId: user.id,
      sessionToken,
      deviceLabel,
      ipAddress,
      userAgent,
      expiresAt,
    });
  }

  private sanitizeUser(user: User): Partial<User> {
    return { ...user };
  }
}
