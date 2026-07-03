import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MastersController } from './masters.controller';
import { MastersService } from './masters.service';

import { StateMaster } from '../../entities/state-master.entity';
import { MgaMaster } from '../../entities/mga-master.entity';
import { MgaDocument } from '../../entities/mga-document.entity';
import { ReinsurerCompany } from '../../entities/reinsurer-company.entity';
import { RiskCompany } from '../../entities/risk-company.entity';
import { LineOfBusiness } from '../../entities/line-of-business.entity';
import { CobMaster } from '../../entities/cob-master.entity';
import { Treaty } from '../../entities/treaty.entity';
import { TreatyLob } from '../../entities/treaty-lob.entity';
import { TreatyLobCob } from '../../entities/treaty-lob-cob.entity';
import { TreatyState } from '../../entities/treaty-state.entity';
import { StateDocument } from '../../entities/state-document.entity';
import { RiskCompanyDocument } from '../../entities/risk-company-document.entity';
import { TreatyMga } from '../../entities/treaty-mga.entity';
import { Broker } from '../../entities/broker.entity';
import { Product } from '../../entities/product.entity';
import { LockedPeriod } from '../../entities/locked-period.entity';
import { DocumentType } from '../../entities/document-type.entity';
import { TreatyCarrier } from '../../entities/treaty-carrier.entity';
import { TreatyReinsurer } from '../../entities/treaty-reinsurer.entity';

import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

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
      TreatyCarrier,
      TreatyReinsurer,
    ]),
    ActivityLogsModule,
  ],
  controllers: [MastersController],
  providers: [MastersService],
  exports: [MastersService],
})
export class MastersModule {}
