import { Module } from '@nestjs/common';
import { LossIbnrService } from './services/loss-ibnr.service';
import { LaeIbnrService } from './services/lae-ibnr.service';
import { UlaeIbnrService } from './services/ulae-ibnr.service';

@Module({
  providers: [LossIbnrService, LaeIbnrService, UlaeIbnrService],
  exports: [LossIbnrService, LaeIbnrService, UlaeIbnrService],
})
export class ReservesModule {}
