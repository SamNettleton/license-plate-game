import { formatTime } from '@/utils/formatters';

describe('formatTime', () => {
  it('formats zero seconds as "0:00"', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('pads single-digit seconds with a leading zero', () => {
    expect(formatTime(5)).toBe('0:05');
    expect(formatTime(65)).toBe('1:05');
  });

  it('formats double-digit seconds correctly', () => {
    expect(formatTime(45)).toBe('0:45');
    expect(formatTime(119)).toBe('1:59');
  });

  it('handles exact minute boundaries', () => {
    expect(formatTime(60)).toBe('1:00');
    expect(formatTime(300)).toBe('5:00');
  });

  it('handles multi-digit minutes', () => {
    expect(formatTime(605)).toBe('10:05');
    expect(formatTime(3540)).toBe('59:00');
  });

  it('formats durations over an hour as "H:MM:SS"', () => {
    expect(formatTime(3600)).toBe('1:00:00');
    expect(formatTime(3665)).toBe('1:01:05');
    expect(formatTime(36000)).toBe('10:00:00');
  });

  it('gracefully handles negative numbers or invalid input', () => {
    expect(formatTime(-10)).toBe('0:00');
    expect(formatTime(NaN)).toBe('0:00');
  });
});
