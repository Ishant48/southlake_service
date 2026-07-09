import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { LossIbnrService } from '../../src/modules/reserves/services/loss-ibnr.service';
import { LaeIbnrService } from '../../src/modules/reserves/services/lae-ibnr.service';
import { UlaeIbnrService } from '../../src/modules/reserves/services/ulae-ibnr.service';
import { FutReservesService } from '../../src/modules/workbook/fut-reserves/fut-reserves.service';

describe('Reserves (e2e)', () => {
  let moduleFixture: TestingModule;
  let lossIbnrService: LossIbnrService;
  let laeIbnrService: LaeIbnrService;
  let ulaeIbnrService: UlaeIbnrService;
  let futReservesService: FutReservesService;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    lossIbnrService = moduleFixture.get(LossIbnrService);
    laeIbnrService = moduleFixture.get(LaeIbnrService);
    ulaeIbnrService = moduleFixture.get(UlaeIbnrService);
    futReservesService = moduleFixture.get(FutReservesService);
  });

  it('Services should be defined', () => {
    expect(lossIbnrService).toBeDefined();
    expect(laeIbnrService).toBeDefined();
    expect(ulaeIbnrService).toBeDefined();
    expect(futReservesService).toBeDefined();
  });

  it('LossIbnrService - calculateLossReserves', () => {
    const result = lossIbnrService.calculateLossReserves(100000, 5000, 51.8);
    expect(result.changeLossReserves).toBe(0);
    expect(result.changeLossIBNR).toBe(51800);
    expect(result.lossesIncurred).toBe(51800);
    expect(result.currLossIBNR).toBe(56800);
  });

  it('LaeIbnrService - calculateLAEReserves', () => {
    const result = laeIbnrService.calculateLAEReserves(100000, 2000, 0, 6.2, 0.0);
    expect(result.changeDCCReserves).toBe(0);
    expect(result.changeDCCIBNR).toBe(6200);
    expect(result.currDCCIBNR).toBe(8200);
    expect(result.dccIncurred).toBe(6200);
  });

  it('UlaeIbnrService - calculateULAEReserves', () => {
    const result = ulaeIbnrService.calculateULAEReserves(100000, 7.0, 1000, 2000, 3000);
    expect(result.ulaePaid).toBeCloseTo(7000);
    expect(result.changeULAEIBNR).toBeCloseTo(12.5);
    expect(result.currULAEIBNR).toBeCloseTo(3012.5);
    expect(result.ulaeIncurred).toBeCloseTo(7012.5);
  });
});
