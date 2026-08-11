import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getLocalDailyDate } from './date';

describe('getLocalDailyDate', () => {
  beforeEach(() => {
    // Tell Vitest to use fake timers before each test
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore real timers after each test to avoid test pollution
    vi.useRealTimers();
  });

  it('formats single-digit months and days with leading zeros', () => {
    // Set system time to January 5th, 2026 at 10:00 AM
    vi.setSystemTime(new Date(2026, 0, 5, 10, 0, 0));

    const result = getLocalDailyDate();
    expect(result).toBe('2026-01-05');
  });

  it('formats double-digit months and days correctly', () => {
    // Set system time to November 25th, 2026 at 10:00 AM
    vi.setSystemTime(new Date(2026, 10, 25, 10, 0, 0));

    const result = getLocalDailyDate();
    expect(result).toBe('2026-11-25');
  });

  it('handles leap day (February 29th) correctly', () => {
    // Set system time to February 29th, 2028
    vi.setSystemTime(new Date(2028, 1, 29, 12, 0, 0));

    const result = getLocalDailyDate();
    expect(result).toBe('2028-02-29');
  });

  it('handles year boundary rollover at late night', () => {
    // Set system time to December 31st, 2026 at 11:59 PM
    vi.setSystemTime(new Date(2026, 11, 31, 23, 59, 59));

    const result = getLocalDailyDate();
    expect(result).toBe('2026-12-31');
  });

  it('handles year boundary rollover just after midnight', () => {
    // Set system time to January 1st, 2027 at 00:00 AM
    vi.setSystemTime(new Date(2027, 0, 1, 0, 0, 0));

    const result = getLocalDailyDate();
    expect(result).toBe('2027-01-01');
  });
});
