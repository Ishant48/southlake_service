import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GlMapping } from '../../entities/gl-mapping.entity';
import { ChartOfAccount } from '../../entities/chart-of-account.entity';
import { GlMappingsService } from './gl-mappings.service';
import { GlMappingsController } from './gl-mappings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GlMapping, ChartOfAccount])],
  controllers: [GlMappingsController],
  providers: [GlMappingsService],
  exports: [GlMappingsService],
})
export class GlMappingsModule {}
