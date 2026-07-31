import { describe, it, expect } from 'vitest';
import { getMilestone, getTierForPoints, getPointsForTier, TIER_THRESHOLDS } from './game';

describe('game.ts', () => {
  describe('getMilestone', () => {
    it('returns Parked for 0 percent', () => {
      const result = getMilestone(0);
      expect(result.label).toBe('Parked');
      expect(result.emoji).toBe('🅿️');
    });

    it('returns Good Start for low positive percentages', () => {
      expect(getMilestone(1).label).toBe('Good Start');
      expect(getMilestone(24).label).toBe('Good Start');
    });

    it('triggers Gaining Speed exactly at 25%', () => {
      const result = getMilestone(25);
      expect(result.label).toBe('Gaining Speed');
      expect(result.filledEmoji).toBe('🟨');
    });

    it('correctly categorizes the 90% High Performance tier', () => {
      const result = getMilestone(90);
      expect(result.label).toBe('High Performance');
      expect(result.emoji).toBe('🏎️');
    });

    it('returns Full Throttle at 100%', () => {
      const result = getMilestone(100);
      expect(result.label).toBe('Full Throttle');
      expect(result.emoji).toBe('🔥');
      expect(result.filledEmoji).toBe('🟦');
    });

    it('returns Supersonic and purple theme at 115% or higher', () => {
      const result = getMilestone(115);
      expect(result.label).toBe('Supersonic');
      expect(result.filledEmoji).toBe('🟪');
      expect(result.color).toBe('secondary.main');

      expect(getMilestone(200).label).toBe('Supersonic');
    });

    it('falls back to the lowest tier when negative percent is provided', () => {
      const result = getMilestone(-5);
      expect(result).toEqual(TIER_THRESHOLDS[0]);
    });
  });

  describe('getTierForPoints', () => {
    it('returns Parked when goalPoints is 0 or negative', () => {
      expect(getTierForPoints(50, 0)).toBe('Parked');
      expect(getTierForPoints(50, -10)).toBe('Parked');
    });

    it('returns Parked when points are 0', () => {
      expect(getTierForPoints(0, 100)).toBe('Parked');
    });

    it('returns correct tier label for calculated percentages', () => {
      expect(getTierForPoints(1, 100)).toBe('Good Start');
      expect(getTierForPoints(25, 100)).toBe('Gaining Speed');
      expect(getTierForPoints(50, 100)).toBe('Cruising');
      expect(getTierForPoints(75, 100)).toBe('In the Fast Lane');
      expect(getTierForPoints(90, 100)).toBe('High Performance');
      expect(getTierForPoints(100, 100)).toBe('Full Throttle');
      expect(getTierForPoints(115, 100)).toBe('Supersonic');
    });
  });

  describe('getPointsForTier', () => {
    it('returns 0 when goalPoints is 0 or negative', () => {
      expect(getPointsForTier(25, 0)).toBe(0);
      expect(getPointsForTier(25, -50)).toBe(0);
    });

    it('calculates exact point requirements for standard and bonus thresholds', () => {
      // Standard tiers at 100 goal points
      expect(getPointsForTier(0, 100)).toBe(0); // Parked
      expect(getPointsForTier(25, 100)).toBe(25); // Gaining Speed
      expect(getPointsForTier(100, 100)).toBe(100); // Full Throttle

      // Bonus tier above 100%
      expect(getPointsForTier(115, 100)).toBe(115); // Supersonic

      // Handles fractional rounding upwards (e.g. 25% of 35 points = 8.75 -> 9)
      expect(getPointsForTier(25, 35)).toBe(9);
    });

    it('rounds up partial points using Math.ceil', () => {
      // 25% of 33 goal points is 8.25 -> rounded up to 9
      expect(getPointsForTier(25, 33)).toBe(9);
    });
  });
});
