/** Maximum accepted upload size for workbook/batch file uploads, in bytes (25 MB). */
export const MAX_UPLOAD_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export interface DefaultProgramRates {
  comm: number;
  ulae: number;
  lossPick: number;
  laeDcc: number;
  laeAoe: number;
  boardsCharge: number;
  lossRatioCap: number;
}

export const DEFAULT_PROGRAM_RATES: Record<string, DefaultProgramRates> = {
  'Excess NX': {
    comm: 32.0,
    ulae: 1.0,
    lossPick: 51.8,
    laeDcc: 6.2,
    laeAoe: 0.0,
    boardsCharge: 0.4,
    lossRatioCap: 2.0,
  },
  'Excess SAM': {
    comm: 32.0,
    ulae: 1.0,
    lossPick: 51.8,
    laeDcc: 6.2,
    laeAoe: 0.0,
    boardsCharge: 0.4,
    lossRatioCap: 2.0,
  },
  'Excess HS': {
    comm: 32.0,
    ulae: 1.0,
    lossPick: 51.8,
    laeDcc: 6.2,
    laeAoe: 0.0,
    boardsCharge: 0.4,
    lossRatioCap: 2.0,
  },
  'APD Local': {
    comm: 29.0,
    ulae: 7.0,
    lossPick: 56.6,
    laeDcc: 0.0,
    laeAoe: 13.4,
    boardsCharge: 0.4,
    lossRatioCap: 2.0,
  },
  'APD Fleet': {
    comm: 29.0,
    ulae: 7.0,
    lossPick: 56.6,
    laeDcc: 0.0,
    laeAoe: 13.4,
    boardsCharge: 0.4,
    lossRatioCap: 2.0,
  },
  'DPR APD': {
    comm: 29.0,
    ulae: 7.0,
    lossPick: 56.6,
    laeDcc: 0.0,
    laeAoe: 13.4,
    boardsCharge: 0.4,
    lossRatioCap: 2.0,
  },
};
