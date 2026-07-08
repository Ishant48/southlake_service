import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import mailConfig from './config/mail.config';
import { validate } from './common/config/env.validation';
import { RateLimitModule } from './common/rate-limit';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ActivityLogsModule } from './modules/activity-logs/activity-logs.module';
import { MailModule } from './modules/mail/mail.module';
import { AuditModule } from './common/interceptors/audit.module';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { AuthGuardModule } from './common/guards/auth-guard.module';
import { ChartOfAccountsModule } from './modules/chart-of-accounts/chart-of-accounts.module';
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
import { ChartOfAccount } from './modules/chart-of-accounts/entities/chart-of-account.entity';
import { ChartOfAccountDocument } from './modules/chart-of-accounts/entities/chart-of-account-document.entity';
import { StateMaster } from './modules/masters/entities/state-master.entity';
import { MgaMaster } from './modules/masters/entities/mga-master.entity';
import { MgaDocument } from './modules/masters/entities/mga-document.entity';
import { ReinsurerCompany } from './modules/masters/entities/reinsurer-company.entity';
import { RiskCompany } from './modules/masters/entities/risk-company.entity';
import { LineOfBusiness } from './modules/masters/entities/line-of-business.entity';
import { CobMaster } from './modules/masters/entities/cob-master.entity';
import { Treaty } from './modules/masters/entities/treaty.entity';
import { TreatyLob } from './modules/masters/entities/treaty-lob.entity';
import { TreatyLobCob } from './modules/masters/entities/treaty-lob-cob.entity';
import { TreatyState } from './modules/masters/entities/treaty-state.entity';
import { StateDocument } from './modules/masters/entities/state-document.entity';
import { RiskCompanyDocument } from './modules/masters/entities/risk-company-document.entity';
import { TreatyMga } from './modules/masters/entities/treaty-mga.entity';
import { TreatyCarrier } from './modules/masters/entities/treaty-carrier.entity';
import { TreatyReinsurer } from './modules/masters/entities/treaty-reinsurer.entity';
import { GlMapping } from './modules/gl-mappings/entities/gl-mapping.entity';
import { JournalEntryBatch } from './modules/journal-entries/entities/journal-entry-batch.entity';
import { JournalEntry } from './modules/journal-entries/entities/journal-entry.entity';
import { MastersModule } from './modules/masters/masters.module';
import { GlMappingsModule } from './modules/gl-mappings/gl-mappings.module';
import { JournalEntriesModule } from './modules/journal-entries/journal-entries.module';
import { TestBalanceModule } from './modules/test-balance/test-balance.module';
import { WorkbookModule } from './modules/workbook/workbook.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ReservesModule } from './modules/reserves/reserves.module';
import { DatabaseSeederModule } from './modules/database-seeder/database-seeder.module';
import { FinancialReportsModule } from './modules/financial-reports/financial-reports.module';
import { Workbook } from './modules/workbook/entities/workbook.entity';
import { StateExhibit } from './modules/workbook/entities/state-exhibit.entity';
import { CashSettlement } from './modules/workbook/entities/cash-settlement.entity';
import { Broker } from './modules/masters/entities/broker.entity';
import { Product } from './modules/masters/entities/product.entity';
import { LockedPeriod } from './modules/masters/entities/locked-period.entity';
import { DocumentType } from './modules/masters/entities/document-type.entity';
import { SequencePrefixCounter } from './modules/masters/entities/sequence-prefix-counter.entity';
import { TreatyTypeMaster } from './modules/masters/entities/treaty-type-master.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, mailConfig],
      envFilePath: '.env',
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
          Workbook,
          StateExhibit,
          CashSettlement,
          ChartOfAccount,
          ChartOfAccountDocument,
          StateMaster,
          MgaMaster,
          MgaDocument,
          ReinsurerCompany,
          RiskCompany,
          LineOfBusiness,
          CobMaster,
          Treaty,
          TreatyLob,
          TreatyLobCob,
          TreatyState,
          TreatyMga,
          TreatyCarrier,
          TreatyReinsurer,
          GlMapping,
          JournalEntryBatch,
          JournalEntry,
          StateDocument,
          RiskCompanyDocument,
          Broker,
          Product,
          LockedPeriod,
          DocumentType,
          SequencePrefixCounter,
          TreatyTypeMaster,
        ],
        synchronize: false,
        logging: process.env.NODE_ENV !== 'production',
        extra: {
          max: configService.get<number>('database.poolMax'),
          idleTimeoutMillis: configService.get<number>('database.poolIdleTimeoutMillis'),
          connectionTimeoutMillis: configService.get<number>(
            'database.poolConnectionTimeoutMillis',
          ),
        },
      }),
    }),
    RateLimitModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    ActivityLogsModule,
    MailModule,
    AuditModule,
    AuthGuardModule,
    ChartOfAccountsModule,
    MastersModule,
    GlMappingsModule,
    JournalEntriesModule,
    TestBalanceModule,
    WorkbookModule,
    ReportsModule,
    ReservesModule,
    DatabaseSeederModule,
    FinancialReportsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
