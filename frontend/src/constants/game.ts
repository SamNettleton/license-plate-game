export enum GameMode {
  DAILY = 'daily',
  PRACTICE = 'practice',
}

export const STORAGE_KEY = {
  [GameMode.DAILY]: 'lp_daily',
  [GameMode.PRACTICE]: 'lp_practice',
} as const;
