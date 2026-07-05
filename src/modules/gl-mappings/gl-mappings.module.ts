import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlMapping } from './entities/gl-mapping.entity';
import { ChartOfAccount } from '../chart-of-accounts/entities/chart-of-account.entity';
import { GlMappingsService } from './gl-mappings.service';
import { GlMappingsController } from './gl-mappings.controller';
import { GlMappingsDao } from './dao/gl-mappings.dao';

@Module({
  imports: [TypeOrmModule.forFeature([GlMapping, ChartOfAccount])],
  controllers: [GlMappingsController],
  providers: [GlMappingsService, GlMappingsDao],
  exports: [GlMappingsService, GlMappingsDao],
})
export class GlMappingsModule {}
