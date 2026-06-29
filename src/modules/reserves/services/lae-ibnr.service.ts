import { Injectable } from '@nestjs/common';

@Injectable()
export class LaeIbnrService {
  calculateLAEReserves(
    premiumsEarned: number,
    prevDCCIBNR: number,
    laeDcc: number,
    laeAoe: number,
  ) {
    let actualPrevDCCIBNR = 0.0;
    let actualPrevAOEIBNR = 0.0;
    if (laeDcc > 0) {
      actualPrevDCCIBNR = prevDCCIBNR;
    } else if (laeAoe > 0) {
      actualPrevAOEIBNR = prevDCCIBNR;
    }

    const changeDCCReserves = 0.0;
    const changeDCCIBNR = premiumsEarned * (laeDcc / 100);
    const currDCCIBNR = actualPrevDCCIBNR + changeDCCIBNR;
    const dccIncurred = changeDCCReserves + changeDCCIBNR;

    const changeAOEReserves = 0.0;
    const changeAOEIBNR = premiumsEarned * (laeAoe / 100);
    const currAOEIBNR = actualPrevAOEIBNR + changeAOEIBNR;
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
