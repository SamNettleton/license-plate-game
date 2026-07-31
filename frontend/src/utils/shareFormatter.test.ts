import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatGameStatsForSharing, GameShareStats } from './shareFormatter';

describe('formatGameStatsForSharing', () => {
  const mockDate = new Date(2026, 6, 15); // Jul 15, 2026

  beforeEach(() => {
    vi.stubGlobal('location', {
      origin: 'https://licenseplate.radrabbit.xyz',
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns an empty string if gameStats is falsy', () => {
    expect(formatGameStatsForSharing(null)).toBe('');
  });

  it('formats game stats correctly at 0% progress (Parked)', () => {
    const stats: GameShareStats = { points: 0, goalPoints: 100 };
    const result = formatGameStatsForSharing(stats, mockDate);

    const expectedLines = [
      'License Plate Game • Jul 15, 2026',
      '',
      'Parked 🅿️ (0 pts)',
      '⬛⬛⬛⬛⬛⬛',
      '',
      'https://licenseplate.radrabbit.xyz',
    ];

    expect(result).toBe(expectedLines.join('\n'));
  });

  it('handles goalPoints = 0 without dividing by zero', () => {
    const stats: GameShareStats = { points: 0, goalPoints: 0 };
    const result = formatGameStatsForSharing(stats, mockDate);

    expect(result).toContain('Parked 🅿️ (0 pts)');
    expect(result).toContain('⬛⬛⬛⬛⬛⬛');
  });

  it('renders partial progress bar with filled emojis (e.g. Cruising @ 50%)', () => {
    // 50% hits thresholds: 1, 25, 50 -> 3 filled blocks with '🟦'
    const stats: GameShareStats = { points: 50, goalPoints: 100 };
    const result = formatGameStatsForSharing(stats, mockDate);

    const expectedLines = [
      'License Plate Game • Jul 15, 2026',
      '',
      'Cruising 🚘 (50 pts)',
      '🟦🟦🟦⬛⬛⬛',
      '',
      'https://licenseplate.radrabbit.xyz',
    ];

    expect(result).toBe(expectedLines.join('\n'));
  });

  it('renders full progress bar when 100% progress is reached (Full Throttle)', () => {
    // 100% hits all 6 thresholds -> 6 filled blocks with '🟦'
    const stats: GameShareStats = { points: 100, goalPoints: 100 };
    const result = formatGameStatsForSharing(stats, mockDate);

    const expectedLines = [
      'License Plate Game • Jul 15, 2026',
      '',
      'Full Throttle 🔥 (100 pts)',
      '🟦🟦🟦🟦🟦🟦',
      '',
      'https://licenseplate.radrabbit.xyz',
    ];

    expect(result).toBe(expectedLines.join('\n'));
  });

  it('formats game stats correctly at 115% progress (Supersonic)', () => {
    const stats: GameShareStats = { points: 115, goalPoints: 100 };
    const result = formatGameStatsForSharing(stats, mockDate);

    const expectedLines = [
      'License Plate Game • Jul 15, 2026',
      '',
      'Supersonic 🚀 (115 pts)',
      '🟪🟪🟪🟪🟪🟪',
      '',
      'https://licenseplate.radrabbit.xyz',
    ];

    expect(result).toBe(expectedLines.join('\n'));
  });

  it('uses current date by default when currentDate parameter is omitted', () => {
    const stats: GameShareStats = { points: 10, goalPoints: 100 };
    const result = formatGameStatsForSharing(stats);

    const currentYear = new Date().getFullYear().toString();
    expect(result).toContain('License Plate Game •');
    expect(result).toContain(currentYear);
  });
});
