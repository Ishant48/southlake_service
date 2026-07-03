import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
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
import { ChartOfAccountsModule } from './modules/chart-of-accounts/chart-of-accounts.module';
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
import { ChartOfAccount } from './entities/chart-of-account.entity';
import { ChartOfAccountDocument } from './entities/chart-of-account-document.entity';
import { StateMaster } from './entities/state-master.entity';
import { MgaMaster } from './entities/mga-master.entity';
import { MgaDocument } from './entities/mga-document.entity';
import { ReinsurerCompany } from './entities/reinsurer-company.entity';
import { RiskCompany } from './entities/risk-company.entity';
import { LineOfBusiness } from './entities/line-of-business.entity';
import { CobMaster } from './entities/cob-master.entity';
import { Treaty } from './entities/treaty.entity';
import { TreatyLob } from './entities/treaty-lob.entity';
import { TreatyLobCob } from './entities/treaty-lob-cob.entity';
import { TreatyState } from './entities/treaty-state.entity';
import { StateDocument } from './entities/state-document.entity';
import { RiskCompanyDocument } from './entities/risk-company-document.entity';
import { TreatyMga } from './entities/treaty-mga.entity';
import { TreatyCarrier } from './entities/treaty-carrier.entity';
import { TreatyReinsurer } from './entities/treaty-reinsurer.entity';
import { GlMapping } from './entities/gl-mapping.entity';
import { JournalEntryBatch } from './entities/journal-entry-batch.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { MastersModule } from './modules/masters/masters.module';
import { GlMappingsModule } from './modules/gl-mappings/gl-mappings.module';
import { JournalEntriesModule } from './modules/journal-entries/journal-entries.module';
import { TestBalanceModule } from './modules/test-balance/test-balance.module';
import { WorkbookModule } from './modules/workbook/workbook.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ReservesModule } from './modules/reserves/reserves.module';
import { DatabaseSeederModule } from './modules/database-seeder/database-seeder.module';
import { FinancialReportsModule } from './modules/financial-reports/financial-reports.module';
import { Workbook } from './entities/workbook.entity';
import { StateExhibit } from './entities/state-exhibit.entity';
import { CashSettlement } from './entities/cash-settlement.entity';
import { Broker } from './entities/broker.entity';
import { Product } from './entities/product.entity';
import { LockedPeriod } from './entities/locked-period.entity';
import { DocumentType } from './entities/document-type.entity';

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
  providers: [],
})
export class AppModule {}
