import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthDao } from './dao/auth.dao';
import { MailModule } from '../mail/mail.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { LoginOtp } from './entities/login-otp.entity';
import { UserSession } from './entities/user-session.entity';
import { LoginChallenge } from './entities/login-challenge.entity';
import { User } from '../users/entities/user.entity';
import { PendingInvite } from '../users/entities/pending-invite.entity';

import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoginOtp, UserSession, LoginChallenge, User, PendingInvite]),
    MailModule,
    ActivityLogsModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthDao],
})
export class AuthModule {}
