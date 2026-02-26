export enum GameMode {
  DAILY = 'daily',
  PRACTICE = 'practice',
}

export const STORAGE_PREFIX = {
  [GameMode.DAILY]: 'lp_daily_',
  [GameMode.PRACTICE]: 'lp_practice_',
} as const;
