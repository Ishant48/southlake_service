import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import mailConfig from './config/mail.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ActivityLogsModule } from './modules/activity-logs/activity-logs.module';
import { MailModule } from './modules/mail/mail.module';
import { AuditModule } from './common/interceptors/audit.module';
import { AuthGuardModule } from './common/guards/auth-guard.module';
import { Role } from './entities/role.entity';
import { User } from './entities/user.entity';
import { Module as ModuleEntity } from './entities/module.entity';
import { Submodule } from './entities/submodule.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { UserPermission } from './entities/user-permission.entity';
import { LoginOtp } from './entities/login-otp.entity';
import { UserSession } from './entities/user-session.entity';
import { LoginChallenge } from './entities/login-challenge.entity';
import { PendingInvite } from './entities/pending-invite.entity';
import { ActivityLog } from './entities/activity-log.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, mailConfig],
      envFilePath: '.env',
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
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    ActivityLogsModule,
    MailModule,
    AuditModule,
    AuthGuardModule,
  ],
})
export class AppModule {}
