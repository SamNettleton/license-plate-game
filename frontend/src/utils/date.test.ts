import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatDateKey,
  toDateOnly,
  addDays,
  startOfMonth,
  daysInMonth,
  getLocalDailyDate,
  getLatestActiveGlobalDate,
} from './date';

describe('date utils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatDateKey', () => {
    it('formats dates as YYYY-MM-DD with zero-padding', () => {
      const date = new Date(2026, 3, 7); // April 7, 2026
      expect(formatDateKey(date)).toBe('2026-04-07');
    });
  });

  describe('toDateOnly', () => {
    it('strips time component and resets hours, minutes, seconds, and ms to 0', () => {
      const input = new Date(2026, 7, 20, 14, 35, 12, 500);
      const result = toDateOnly(input);

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(7);
      expect(result.getDate()).toBe(20);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('does not mutate the original Date instance', () => {
      const input = new Date(2026, 7, 20, 14, 35);
      const result = toDateOnly(input);

      expect(input.getHours()).toBe(14);
      expect(result).not.toBe(input);
    });
  });

  describe('addDays', () => {
    it('adds positive days correctly', () => {
      const start = new Date(2026, 7, 10);
      const result = addDays(start, 5);

      expect(formatDateKey(result)).toBe('2026-08-15');
    });

    it('subtracts days when given a negative amount', () => {
      const start = new Date(2026, 7, 10);
      const result = addDays(start, -3);

      expect(formatDateKey(result)).toBe('2026-08-07');
    });

    it('handles month roll-overs seamlessly', () => {
      const start = new Date(2026, 7, 30); // Aug 30
      const result = addDays(start, 3);

      expect(formatDateKey(result)).toBe('2026-09-02');
    });
  });

  describe('startOfMonth', () => {
    it('returns the first day of the given month', () => {
      const date = new Date(2026, 7, 20);
      const result = startOfMonth(date);

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(7);
      expect(result.getDate()).toBe(1);
    });
  });

  describe('daysInMonth', () => {
    it('returns correct days for standard months', () => {
      expect(daysInMonth(new Date(2026, 0, 15))).toBe(31); // Jan
      expect(daysInMonth(new Date(2026, 3, 10))).toBe(30); // Apr
    });

    it('returns 28 for February in non-leap years', () => {
      expect(daysInMonth(new Date(2026, 1, 10))).toBe(28);
    });

    it('returns 29 for February in leap years', () => {
      expect(daysInMonth(new Date(2028, 1, 10))).toBe(29);
    });
  });

  describe('getLocalDailyDate', () => {
    it('formats single-digit months and days with leading zeros', () => {
      vi.setSystemTime(new Date(2026, 0, 5, 10, 0, 0));
      expect(getLocalDailyDate()).toBe('2026-01-05');
    });

    it('formats double-digit months and days correctly', () => {
      vi.setSystemTime(new Date(2026, 10, 25, 10, 0, 0));
      expect(getLocalDailyDate()).toBe('2026-11-25');
    });

    it('handles leap day (February 29th) correctly', () => {
      vi.setSystemTime(new Date(2028, 1, 29, 12, 0, 0));
      expect(getLocalDailyDate()).toBe('2028-02-29');
    });

    it('handles year boundary rollover at late night', () => {
      vi.setSystemTime(new Date(2026, 11, 31, 23, 59, 59));
      expect(getLocalDailyDate()).toBe('2026-12-31');
    });

    it('handles year boundary rollover just after midnight', () => {
      vi.setSystemTime(new Date(2027, 0, 1, 0, 0, 0));
      expect(getLocalDailyDate()).toBe('2027-01-01');
    });
  });

  describe('getLatestActiveGlobalDate', () => {
    it('returns local date matching UTC date when UTC+14 remains on the same calendar day', () => {
      // Set time to UTC 02:00 on Aug 20, 2026.
      // UTC+14 is 16:00 (4 PM) on Aug 20, 2026 -> Active date: Aug 20, 2026.
      vi.setSystemTime(new Date(Date.UTC(2026, 7, 20, 2, 0, 0)));

      const activeDate = getLatestActiveGlobalDate();
      expect(activeDate.getFullYear()).toBe(2026);
      expect(activeDate.getMonth()).toBe(7);
      expect(activeDate.getDate()).toBe(20);
    });

    it('rolls over to the next calendar date as soon as UTC+14 crosses midnight (10:00 AM UTC)', () => {
      // Set time to UTC 10:00 AM on Aug 19, 2026.
      // UTC+14 is 00:00 (Midnight) on Aug 20, 2026 -> Aug 20 becomes active globally!
      vi.setSystemTime(new Date(Date.UTC(2026, 7, 19, 10, 0, 0)));

      const activeDate = getLatestActiveGlobalDate();
      expect(activeDate.getFullYear()).toBe(2026);
      expect(activeDate.getMonth()).toBe(7);
      expect(activeDate.getDate()).toBe(20);
    });

    it('remains on current calendar date 1 millisecond before UTC+14 midnight (09:59:59.999 UTC)', () => {
      // 09:59:59.999 UTC on Aug 19, 2026 -> UTC+14 is 23:59:59.999 on Aug 19, 2026.
      // Aug 20 is not active anywhere yet.
      vi.setSystemTime(new Date(Date.UTC(2026, 7, 19, 9, 59, 59, 999)));

      const activeDate = getLatestActiveGlobalDate();
      expect(activeDate.getFullYear()).toBe(2026);
      expect(activeDate.getMonth()).toBe(7);
      expect(activeDate.getDate()).toBe(19);
    });
  });
});
