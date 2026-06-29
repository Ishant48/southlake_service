import { Injectable } from '@nestjs/common';

@Injectable()
export class UlaeIbnrService {
  calculateULAEReserves(
    pw: number,
    rateUlae: number,
    changeLossIBNR: number,
    prevULAEIBNR: number,
  ) {
    const ulaePaid = pw * (rateUlae / 100);
    const changeULAEIBNR = changeLossIBNR * 0.005; // 0.5% proportional change
    const currULAEIBNR = prevULAEIBNR + changeULAEIBNR;
    const ulaeIncurred = ulaePaid + changeULAEIBNR;

    return {
      ulaePaid,
      changeULAEIBNR,
      currULAEIBNR,
      ulaeIncurred,
    };
  }
}
