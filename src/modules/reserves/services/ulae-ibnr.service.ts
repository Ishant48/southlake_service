import { Injectable } from '@nestjs/common';

@Injectable()
export class UlaeIbnrService {
  calculateULAEReserves(
    pw: number,
    rateUlae: number,
    changeLossReserves: number,
    changeLossIBNR: number,
    prevULAEIBNR: number,
  ) {
    const ulaePaid = pw * (rateUlae / 100);
    const changeULAEIBNR = (0.5 * changeLossReserves + changeLossIBNR) * 0.005;
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
