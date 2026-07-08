import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { hashToken } from '../../common/utils/hash-token.util';
import { AuthDao } from './dao/auth.dao';
import { MailService } from '../mail/mail.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResolveChallengeDto } from './dto/resolve-challenge.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { UserSession } from './entities/user-session.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authDao: AuthDao,
    private readonly mailService: MailService,
    private readonly activityLogsService: ActivityLogsService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async login(dto: LoginDto, ipAddress: string): Promise<{ message: string }> {
    const { email, password } = dto;

    const user = await this.authDao.findUserWithPasswordByEmail(email);

    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordMatch) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.status !== 'active') {
      throw new UnauthorizedException('Your account is inactive.');
    }

    const rateLimitWindow = new Date(Date.now() - 15 * 60 * 1000);
    const recentCount = await this.authDao.countRecentOtps(email, rateLimitWindow);

    if (recentCount >= 3) {
      throw new BadRequestException('Too many OTP requests. Please wait 15 minutes.');
    }

    const otpExpiryMinutes = this.configService.get<number>('app.otpExpiryMinutes') ?? 5;
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + otpExpiryMinutes * 60 * 1000);

    await this.authDao.saveOtp({ email, otpHash, expiresAt });

    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[DEV OTP] ${email} → ${otp}`);
    }

    this.mailService
      .sendOtp(email, otp)
      .catch(err => this.logger.error(`Failed to send OTP email to ${email}`, err));

    await this.activityLogsService.log({
      action: 'otp_requested',
      description: `OTP requested for ${email}`,
      ipAddress,
    });

    return { message: 'OTP sent to your email.' };
  }

  async verifyOtp(
    dto: VerifyOtpDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<Record<string, unknown>> {
    const { email, otp, device_label } = dto;
    const maxAttempts = this.configService.get<number>('app.otpMaxAttempts') ?? 5;

    const otpRecord = await this.authDao.findActiveOtp(email);

    if (!otpRecord) {
      throw new UnauthorizedException('No valid OTP found. Please request a new one.');
    }

    if (otpRecord.attemptCount >= maxAttempts) {
      throw new UnauthorizedException('Maximum OTP attempts exceeded. Please request a new one.');
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
        newDeviceLabel: device_label ?? undefined,
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

    const { token: sessionToken } = await this.createSession(
      user,
      device_label ?? undefined,
      ipAddress,
      userAgent,
    );

    await this.activityLogsService.log({
      userId: user.id,
      action: 'login',
      description: `User ${email} logged in`,
      ipAddress,
      userAgent,
    });

    const permissions = await this.usersService.getPermissions(user.id);

    return {
      token_type: 'session',
      session_token: sessionToken,
      user: {
        ...this.sanitizeUser(user),
        permissions,
      },
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

    const { token: sessionToken } = await this.createSession(
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

    const permissions = await this.usersService.getPermissions(user.id);

    return {
      session_token: sessionToken,
      user: {
        ...this.sanitizeUser(user),
        permissions,
      },
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

  async getMe(user: User): Promise<
    | (User & {
        permissions: { id: string; action: string }[];
        effective_permissions: string[];
      })
    | null
  > {
    const fullUser = await this.authDao.findUserByEmail(user.email);
    if (!fullUser) return null;
    const [permissions, effectivePermissions] = await Promise.all([
      this.usersService.getPermissions(fullUser.id),
      this.usersService.getEffectivePermissions(fullUser.id),
    ]);
    return {
      ...fullUser,
      permissions,
      effective_permissions: effectivePermissions,
    };
  }

  private async createSession(
    user: User,
    deviceLabel: string | undefined,
    ipAddress: string,
    userAgent: string,
  ): Promise<{ session: UserSession; token: string }> {
    const token = crypto.randomBytes(32).toString('hex');
    const sessionExpiryHours = this.configService.get<number>('app.sessionExpiryHours') ?? 1;
    const expiresAt = new Date(Date.now() + sessionExpiryHours * 60 * 60 * 1000);

    const session = await this.authDao.saveSession({
      userId: user.id,
      sessionToken: hashToken(token),
      deviceLabel,
      ipAddress,
      userAgent,
      expiresAt,
    });

    return { session, token };
  }

  async getInviteDetails(token: string): Promise<{ email: string; name: string }> {
    if (!token) {
      throw new BadRequestException('Token is required.');
    }
    const invite = await this.authDao.findInviteByToken(token);
    if (!invite) {
      throw new NotFoundException('Invalid invitation token.');
    }
    if (invite.status !== 'pending') {
      throw new BadRequestException('Invitation has already been accepted or revoked.');
    }
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired.');
    }
    return { email: invite.email, name: invite.name };
  }

  async acceptInvite(dto: AcceptInviteDto): Promise<Record<string, unknown>> {
    const { token, password } = dto;
    const invite = await this.authDao.findInviteByToken(token);
    if (!invite) {
      throw new NotFoundException('Invalid invitation token.');
    }
    if (invite.status !== 'pending') {
      throw new BadRequestException('Invitation has already been accepted or revoked.');
    }
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired.');
    }

    const existing = await this.authDao.findUserByEmail(invite.email);
    if (existing) {
      throw new BadRequestException(`A user with email ${invite.email} already exists.`);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let initials = '';
    const parts = invite.name.trim().split(/\s+/);
    if (parts.length > 1) {
      initials = parts
        .map(p => p[0])
        .join('')
        .slice(0, 4)
        .toUpperCase();
    } else if (parts.length === 1 && parts[0]) {
      initials = parts[0].slice(0, 2).toUpperCase();
    }

    const user = await this.authDao.saveUser({
      email: invite.email,
      name: invite.name,
      roleId: invite.roleId,
      userType: invite.userType,
      department: invite.department,
      title: invite.title,
      status: 'active',
      passwordHash,
      initials,
      avatarColor: '#0d1b4b',
      joinedDate: new Date(),
      createdBy: invite.invitedBy,
    });

    invite.status = 'accepted';
    await this.authDao.saveInvite(invite);

    await this.activityLogsService.log({
      userId: user.id,
      action: 'invite_accepted',
      description: `Invitation accepted by ${invite.email}`,
    });

    const { token: sessionToken } = await this.createSession(
      user,
      'Default Device',
      'unknown',
      'unknown',
    );

    const permissions = await this.usersService.getPermissions(user.id);

    return {
      token_type: 'session',
      session_token: sessionToken,
      user: {
        ...this.sanitizeUser(user),
        permissions,
      },
    };
  }

  private sanitizeUser(user: User): Partial<User> {
    const { passwordHash: _passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
