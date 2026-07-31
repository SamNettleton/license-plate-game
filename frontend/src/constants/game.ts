export enum GameMode {
  DAILY = 'daily',
  PRACTICE = 'practice',
}

export const STORAGE_KEY = {
  [GameMode.DAILY]: 'lp_daily',
  [GameMode.PRACTICE]: 'lp_practice',
} as const;

export interface Milestone {
  percent: number;
  label: string;
  emoji: string;
  filledEmoji: string;
  color: string;
}

export const TIER_THRESHOLDS: ReadonlyArray<Milestone> = [
  { percent: 0, label: 'Parked', emoji: '🅿️', filledEmoji: '🟨', color: 'text.disabled' },
  { percent: 1, label: 'Good Start', emoji: '🔑', filledEmoji: '🟨', color: 'text.secondary' },
  { percent: 25, label: 'Gaining Speed', emoji: '⛽', filledEmoji: '🟨', color: 'primary.main' },
  { percent: 50, label: 'Cruising', emoji: '🚘', filledEmoji: '🟦', color: 'primary.main' },
  { percent: 75, label: 'In the Fast Lane', emoji: '🛣️', filledEmoji: '🟦', color: 'primary.main' },
  { percent: 90, label: 'High Performance', emoji: '🏎️', filledEmoji: '🟦', color: 'primary.main' },
  { percent: 100, label: 'Full Throttle', emoji: '🔥', filledEmoji: '🟦', color: 'primary.main' },
  { percent: 115, label: 'Supersonic', emoji: '🚀', filledEmoji: '🟪', color: 'secondary.main' },
];

/**
 * Returns the highest Milestone achieved for a given percentage.
 */
export const getMilestone = (percent: number): Milestone => {
  const match = [...TIER_THRESHOLDS].reverse().find((tier) => percent >= tier.percent);
  return match ?? TIER_THRESHOLDS[0];
};

/**
 * Returns the active tier label from raw points and goal points.
 */
export const getTierForPoints = (points: number, goalPoints: number): string => {
  if (goalPoints <= 0) return TIER_THRESHOLDS[0].label;
  const percent = Math.round((points / goalPoints) * 100 * 100) / 100;
  return getMilestone(percent).label;
};

/**
 * Returns the points needed for a given tier threshold.
 */
export const getPointsForTier = (percentThreshold: number, goalPoints: number): number => {
  if (goalPoints <= 0) return 0;
  return Math.ceil((percentThreshold / 100) * goalPoints);
};
