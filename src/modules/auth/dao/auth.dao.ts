import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { LoginOtp } from '../entities/login-otp.entity';
import { UserSession } from '../entities/user-session.entity';
import { LoginChallenge } from '../entities/login-challenge.entity';
import { PasswordResetToken } from '../entities/password-reset-token.entity';
import { User } from '../../users/entities/user.entity';
import { PendingInvite } from '../../users/entities/pending-invite.entity';

@Injectable()
export class AuthDao {
  constructor(
    @InjectRepository(LoginOtp)
    private readonly otpRepo: Repository<LoginOtp>,
    @InjectRepository(UserSession)
    private readonly sessionRepo: Repository<UserSession>,
    @InjectRepository(LoginChallenge)
    private readonly challengeRepo: Repository<LoginChallenge>,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokenRepo: Repository<PasswordResetToken>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(PendingInvite)
    private readonly inviteRepo: Repository<PendingInvite>,
  ) {}

  findUserByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email, isDeleted: false },
      relations: ['role'],
    });
  }

  findUserWithPasswordByEmail(email: string): Promise<User | null> {
    return this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.role', 'role')
      .where('user.email = :email', { email })
      .andWhere('user.isDeleted = :isDeleted', { isDeleted: false })
      .getOne();
  }

  findUserById(id: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id, isDeleted: false },
      relations: ['role'],
    });
  }

  async countRecentOtps(email: string, since: Date): Promise<number> {
    return this.otpRepo.count({
      where: {
        email,
        createdAt: MoreThan(since),
      },
    });
  }

  saveOtp(otp: Partial<LoginOtp>): Promise<LoginOtp> {
    return this.otpRepo.save(this.otpRepo.create(otp));
  }

  findActiveOtp(email: string): Promise<LoginOtp | null> {
    return this.otpRepo.findOne({
      where: {
        email,
        isUsed: false,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async markOtpUsed(otp: LoginOtp): Promise<void> {
    otp.isUsed = true;
    await this.otpRepo.save(otp);
  }

  async incrementOtpAttempt(otp: LoginOtp): Promise<void> {
    otp.attemptCount += 1;
    await this.otpRepo.save(otp);
  }

  findActiveSessionForUser(userId: string): Promise<UserSession | null> {
    return this.sessionRepo.findOne({
      where: {
        userId,
        isActive: true,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
    });
  }

  saveSession(session: Partial<UserSession>): Promise<UserSession> {
    return this.sessionRepo.save(this.sessionRepo.create(session));
  }

  async revokeSession(session: UserSession, reason: string): Promise<void> {
    session.isActive = false;
    session.revokedAt = new Date();
    session.revokeReason = reason;
    await this.sessionRepo.save(session);
  }

  findSessionByToken(token: string): Promise<UserSession | null> {
    return this.sessionRepo.findOne({
      where: { sessionToken: token, isActive: true },
    });
  }

  findSessionById(id: string): Promise<UserSession | null> {
    return this.sessionRepo.findOne({ where: { id } });
  }

  saveChallenge(challenge: Partial<LoginChallenge>): Promise<LoginChallenge> {
    return this.challengeRepo.save(this.challengeRepo.create(challenge));
  }

  findChallenge(token: string): Promise<LoginChallenge | null> {
    return this.challengeRepo.findOne({
      where: { challengeToken: token, status: 'pending' },
      relations: ['existingSession'],
    });
  }

  async resolveChallenge(challenge: LoginChallenge, status: string): Promise<void> {
    challenge.status = status;
    challenge.resolvedAt = new Date();
    await this.challengeRepo.save(challenge);
  }

  // Intentionally a raw update(), not save(): this fires on every login and
  // isn't a change worth an audit-log entry (see AuditSubscriber, which only
  // observes save()/remove() — this bypasses it on purpose).
  async updateUserLastLogin(userId: string): Promise<void> {
    await this.userRepo.update(userId, { lastLoginAt: new Date() });
  }

  async countRecentPasswordResets(userId: string, since: Date): Promise<number> {
    return this.resetTokenRepo.count({
      where: {
        userId,
        createdAt: MoreThan(since),
      },
    });
  }

  saveResetToken(entry: Partial<PasswordResetToken>): Promise<PasswordResetToken> {
    return this.resetTokenRepo.save(this.resetTokenRepo.create(entry));
  }

  findActiveResetToken(tokenHash: string): Promise<PasswordResetToken | null> {
    return this.resetTokenRepo.findOne({
      where: {
        tokenHash,
        isUsed: false,
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  async markResetTokenUsed(token: PasswordResetToken): Promise<void> {
    token.isUsed = true;
    await this.resetTokenRepo.save(token);
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await this.userRepo.save({ id: userId, passwordHash });
  }

  async revokeAllSessionsForUser(userId: string, reason: string): Promise<void> {
    await this.sessionRepo
      .createQueryBuilder()
      .update(UserSession)
      .set({ isActive: false, revokedAt: new Date(), revokeReason: reason })
      .where('user_id = :userId', { userId })
      .andWhere('is_active = :isActive', { isActive: true })
      .execute();
  }

  findInviteByToken(token: string): Promise<PendingInvite | null> {
    return this.inviteRepo.findOne({ where: { token } });
  }

  saveInvite(invite: PendingInvite): Promise<PendingInvite> {
    return this.inviteRepo.save(invite);
  }

  saveUser(user: Partial<User>): Promise<User> {
    return this.userRepo.save(this.userRepo.create(user));
  }
}
