import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { existsSync, mkdirSync } from 'fs';

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
import { Broker } from './entities/broker.entity';
import { Product } from './entities/product.entity';
import { LockedPeriod } from './entities/locked-period.entity';
import { DocumentType } from './entities/document-type.entity';
import { SequencePrefixCounter } from './entities/sequence-prefix-counter.entity';
import { TreatyCarrier } from './entities/treaty-carrier.entity';
import { TreatyReinsurer } from './entities/treaty-reinsurer.entity';
import { TreatyTypeMaster } from './entities/treaty-type-master.entity';

import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

import { StatesController } from './states/states.controller';
import { StatesService } from './states/states.service';
import { StatesDao } from './states/dao/states.dao';

import { MgasController } from './mgas/mgas.controller';
import { MgasService } from './mgas/mgas.service';
import { MgasDao } from './mgas/dao/mgas.dao';

import { ReinsurersController } from './reinsurers/reinsurers.controller';
import { ReinsurersService } from './reinsurers/reinsurers.service';
import { ReinsurersDao } from './reinsurers/dao/reinsurers.dao';

import { RiskCompaniesController } from './risk-companies/risk-companies.controller';
import { RiskCompaniesService } from './risk-companies/risk-companies.service';
import { RiskCompaniesDao } from './risk-companies/dao/risk-companies.dao';

import { LobsController } from './lobs/lobs.controller';
import { LobsService } from './lobs/lobs.service';
import { LobsDao } from './lobs/dao/lobs.dao';

import { CobsController } from './cobs/cobs.controller';
import { CobsService } from './cobs/cobs.service';
import { CobsDao } from './cobs/dao/cobs.dao';

import { TreatiesController } from './treaties/treaties.controller';
import { TreatiesService } from './treaties/treaties.service';
import { TreatiesDao } from './treaties/dao/treaties.dao';

import { BrokersController } from './brokers/brokers.controller';
import { BrokersService } from './brokers/brokers.service';
import { BrokersDao } from './brokers/dao/brokers.dao';

import { ProductsController } from './products/products.controller';
import { ProductsService } from './products/products.service';
import { ProductsDao } from './products/dao/products.dao';

import { TreatyTypesController } from './treaty-types/treaty-types.controller';
import { TreatyTypesService } from './treaty-types/treaty-types.service';
import { TreatyTypesDao } from './treaty-types/dao/treaty-types.dao';

import { MastersConfigController } from './masters-config/masters-config.controller';
import { MastersConfigService } from './masters-config/masters-config.service';
import { MastersConfigDao } from './masters-config/dao/masters-config.dao';

// Ensure uploads directory exists (used by states/mgas/risk-companies document uploads)
const uploadDir = './uploads';
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

@Module({
  imports: [
    TypeOrmModule.forFeature([
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
      StateDocument,
      RiskCompanyDocument,
      Broker,
      Product,
      LockedPeriod,
      DocumentType,
      SequencePrefixCounter,
      TreatyCarrier,
      TreatyReinsurer,
      TreatyTypeMaster,
    ]),
    ActivityLogsModule,
  ],
  controllers: [
    StatesController,
    MgasController,
    ReinsurersController,
    RiskCompaniesController,
    LobsController,
    CobsController,
    TreatiesController,
    BrokersController,
    ProductsController,
    TreatyTypesController,
    MastersConfigController,
  ],
  providers: [
    StatesService,
    StatesDao,
    MgasService,
    MgasDao,
    ReinsurersService,
    ReinsurersDao,
    RiskCompaniesService,
    RiskCompaniesDao,
    LobsService,
    LobsDao,
    CobsService,
    CobsDao,
    TreatiesService,
    TreatiesDao,
    BrokersService,
    BrokersDao,
    ProductsService,
    ProductsDao,
    TreatyTypesService,
    TreatyTypesDao,
    MastersConfigService,
    MastersConfigDao,
  ],
  exports: [
    StatesService,
    MgasService,
    ReinsurersService,
    RiskCompaniesService,
    LobsService,
    CobsService,
    TreatiesService,
    BrokersService,
    ProductsService,
    TreatyTypesService,
    MastersConfigService,
  ],
})
export class MastersModule {}
