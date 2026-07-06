import { Injectable } from '@nestjs/common';

@Injectable()
export class LaeIbnrService {
  calculateLAEReserves(
    premiumsEarned: number,
    prevDCCIBNR: number,
    prevAOEIBNR: number,
    laeDcc: number,
    laeAoe: number,
  ) {
    const changeDCCReserves = 0.0;
    const changeDCCIBNR = premiumsEarned * (laeDcc / 100);
    const currDCCIBNR = prevDCCIBNR + changeDCCIBNR;
    const dccIncurred = changeDCCReserves + changeDCCIBNR;

    const changeAOEReserves = 0.0;
    const changeAOEIBNR = premiumsEarned * (laeAoe / 100);
    const currAOEIBNR = prevAOEIBNR + changeAOEIBNR;
    const aoeIncurred = changeAOEReserves + changeAOEIBNR;

    return {
      changeDCCReserves,
      changeDCCIBNR,
      currDCCIBNR,
      dccIncurred,
      changeAOEReserves,
      changeAOEIBNR,
      currAOEIBNR,
      aoeIncurred,
    };
  }
}
