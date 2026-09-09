import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchDailyPlate } from './plateService';

const mockApiInstance = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => mockApiInstance),
    },
  };
});

describe('plateService utility functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchDailyPlate uses default parameters and provides fallbacks for missing stats', async () => {
    const mockApiResponse = {
      data: {
        sequence: 'ABC',
        total_count: 10,
        goal_points: 60,
      },
    };

    mockApiInstance.get.mockResolvedValueOnce(mockApiResponse);

    const result = await fetchDailyPlate();

    expect(mockApiInstance.get).toHaveBeenCalled();
    const calledUrl = mockApiInstance.get.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/plate/daily?date=');

    expect(result).toEqual({
      sequence: 'ABC',
      solutionsCount: 10,
      goalPoints: 60,
      wordsFound: [],
      pointsEarned: 0,
      elapsedSeconds: 0,
      tierTimes: {},
    });
  });

  it('fetchDailyPlate passes userId and date params and transforms state payload', async () => {
    const mockApiResponse = {
      data: {
        sequence: 'XYZ',
        total_count: 42,
        goal_points: 250,
        words_found: ['CAT', 'TACO'],
        points_earned: 15,
        elapsed_seconds: 45,
        tier_times: { bronze: 10, silver: 30 },
      },
    };

    mockApiInstance.get.mockResolvedValueOnce(mockApiResponse);

    const result = await fetchDailyPlate('user-123', '2026-08-18');

    expect(mockApiInstance.get).toHaveBeenCalledWith(
      '/plate/daily?date=2026-08-18&user_id=user-123',
    );

    expect(result).toEqual({
      sequence: 'XYZ',
      solutionsCount: 42,
      goalPoints: 250,
      wordsFound: ['CAT', 'TACO'],
      pointsEarned: 15,
      elapsedSeconds: 45,
      tierTimes: { bronze: 10, silver: 30 },
    });
  });
});
