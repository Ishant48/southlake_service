import { Module } from '@nestjs/common';
import { TestBalanceController } from './test-balance.controller';
import { TestBalanceService } from './test-balance.service';

@Module({
  controllers: [TestBalanceController],
  providers: [TestBalanceService],
  exports: [TestBalanceService],
})
export class TestBalanceModule {}
