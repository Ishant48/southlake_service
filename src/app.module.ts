import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import mailConfig from './config/mail.config';
import redisConfig from './config/redis.config';
import { validate } from './common/config/env.validation';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ActivityLogsModule } from './modules/activity-logs/activity-logs.module';
import { MailModule } from './modules/mail/mail.module';
import { AuditModule } from './common/interceptors/audit.module';
import { AuthGuardModule } from './common/guards/auth-guard.module';
import { RateLimitModule } from './common/rate-limit';
import { CommunicationModule } from './common/communication';
import { Role } from './modules/roles/entities/role.entity';
import { User } from './modules/users/entities/user.entity';
import { Module as ModuleEntity } from './modules/permissions/entities/module.entity';
import { Submodule } from './modules/permissions/entities/submodule.entity';
import { Permission } from './modules/permissions/entities/permission.entity';
import { RolePermission } from './modules/roles/entities/role-permission.entity';
import { UserPermission } from './modules/users/entities/user-permission.entity';
import { LoginOtp } from './modules/auth/entities/login-otp.entity';
import { UserSession } from './modules/auth/entities/user-session.entity';
import { LoginChallenge } from './modules/auth/entities/login-challenge.entity';
import { PendingInvite } from './modules/users/entities/pending-invite.entity';
import { ActivityLog } from './modules/activity-logs/entities/activity-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, mailConfig, redisConfig],
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
      validate,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        database: configService.get<string>('database.name'),
        username: configService.get<string>('database.user'),
        password: configService.get<string>('database.password'),
        entities: [
          Role,
          User,
          ModuleEntity,
          Submodule,
          Permission,
          RolePermission,
          UserPermission,
          LoginOtp,
          UserSession,
          LoginChallenge,
          PendingInvite,
          ActivityLog,
        ],
        synchronize: false,
        logging: process.env.NODE_ENV !== 'production',
      }),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host') || 'localhost',
          port: configService.get<number>('redis.port') || 6379,
          password: configService.get<string>('redis.password') || undefined,
        },
      }),
    }),
    RateLimitModule,
    CommunicationModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    ActivityLogsModule,
    MailModule,
    AuditModule,
    AuthGuardModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
