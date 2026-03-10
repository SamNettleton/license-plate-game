import { describe, it, expect } from 'vitest';
import { getMilestone } from './game';

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

  it('correctly categorizes the 90% High Performance tier', () => {
    const result = getMilestone(90);
    expect(result.label).toBe('High Performance');
    expect(result.emoji).toBe('🏎️');
  });
});
