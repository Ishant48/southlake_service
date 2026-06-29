import { Injectable } from '@nestjs/common';

@Injectable()
export class LossIbnrService {
  calculateLossReserves(premiumsEarned: number, prevLossIBNR: number, lossPick: number) {
    const changeLossReserves = 0.0;
    const changeLossIBNR = premiumsEarned * (lossPick / 100);
    const lossesIncurred = changeLossReserves + changeLossIBNR;
    const currLossIBNR = prevLossIBNR + changeLossIBNR;

    return {
      changeLossReserves,
      changeLossIBNR,
      lossesIncurred,
      currLossIBNR,
    };
  }
}
