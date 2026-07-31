import { getMilestone } from '@/constants/game';

export type GameShareStats = {
  points: number;
  goalPoints: number;
};

export const formatGameStatsForSharing = (
  gameStats: GameShareStats | null | undefined,
  currentDate = new Date(),
): string => {
  if (!gameStats) return '';

  const { points, goalPoints } = gameStats;
  const currentPercentage = goalPoints > 0 ? Math.round((points / goalPoints) * 100) : 0;

  const dateStr = currentDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const thresholds = [1, 25, 50, 75, 90, 100];

  const { label, emoji, filledEmoji } = getMilestone(currentPercentage);
  const emptyEmoji = '⬛';

  const visualBar = thresholds
    .map((t) => (currentPercentage >= t ? filledEmoji : emptyEmoji))
    .join('');

  return [
    `License Plate Game • ${dateStr}`,
    '',
    `${label} ${emoji} (${points} pts)`,
    visualBar,
    '',
    window.location.origin,
  ].join('\n');
};
