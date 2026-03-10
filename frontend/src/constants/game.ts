export enum GameMode {
  DAILY = 'daily',
  PRACTICE = 'practice',
}

export const STORAGE_KEY = {
  [GameMode.DAILY]: 'lp_daily',
  [GameMode.PRACTICE]: 'lp_practice',
} as const;

export interface Milestone {
  label: string;
  emoji: string;
  filledEmoji: string;
  color: string;
}

export const getMilestone = (percent: number): Milestone => {
  if (percent >= 115)
    return { label: 'Supersonic', emoji: '🚀', filledEmoji: '🟪', color: 'secondary.main' };
  if (percent >= 100)
    return { label: 'Full Throttle', emoji: '🔥', filledEmoji: '🟦', color: 'primary.main' };
  if (percent >= 90)
    return { label: 'High Performance', emoji: '🏎️', filledEmoji: '🟦', color: 'primary.main' };
  if (percent >= 75)
    return { label: 'In the Fast Lane', emoji: '🛣️', filledEmoji: '🟦', color: 'primary.main' };
  if (percent >= 50)
    return { label: 'Cruising', emoji: '🚘', filledEmoji: '🟦', color: 'primary.main' };
  if (percent >= 25)
    return { label: 'Gaining Speed', emoji: '⛽', filledEmoji: '🟨', color: 'primary.main' };
  if (percent > 0)
    return { label: 'Good Start', emoji: '🔑', filledEmoji: '🟨', color: 'text.secondary' };
  return { label: 'Parked', emoji: '🅿️', filledEmoji: '🟨', color: 'text.disabled' };
};
