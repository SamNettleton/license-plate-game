import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchDailyStats, normalizeDailyStatMetrics } from './statsService';

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

describe('statsService utility functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normalizeDailyStatMetrics', () => {
    it('correctly maps raw snake_case metrics to camelCase', () => {
      const rawMetrics = {
        avg_word_length: 5.4,
        min_word_length: 3,
        max_word_length: 9,
        total_points: 120,
        words_found_count: 15,
      };

      const normalized = normalizeDailyStatMetrics(rawMetrics);

      expect(normalized).toEqual({
        avgWordLength: 5.4,
        minWordLength: 3,
        maxWordLength: 9,
        totalPoints: 120,
        wordsFoundCount: 15,
      });
    });

    it('provides zeroed fallbacks for missing or undefined properties', () => {
      // @ts-expect-error testing runtime fallback defense against malformed payload
      const normalized = normalizeDailyStatMetrics({});

      expect(normalized).toEqual({
        avgWordLength: 0,
        minWordLength: 0,
        maxWordLength: 0,
        totalPoints: 0,
        wordsFoundCount: 0,
      });
    });
  });

  describe('fetchDailyStats', () => {
    it('fetches daily stats without params and transforms snake_case to camelCase', async () => {
      const mockApiResponse = {
        data: {
          date: '2026-08-21',
          global_stats: {
            avg_word_length: 4.8,
            min_word_length: 3,
            max_word_length: 10,
            total_points: 450,
            words_found_count: 50,
          },
          user_stats: {
            avg_word_length: 5.2,
            min_word_length: 4,
            max_word_length: 8,
            total_points: 85,
            words_found_count: 12,
          },
        },
      };

      mockApiInstance.get.mockResolvedValueOnce(mockApiResponse);

      const result = await fetchDailyStats();

      expect(mockApiInstance.get).toHaveBeenCalledWith('/stats/daily', {
        params: {},
      });

      expect(result).toEqual({
        date: '2026-08-21',
        globalStats: {
          avgWordLength: 4.8,
          minWordLength: 3,
          maxWordLength: 10,
          totalPoints: 450,
          wordsFoundCount: 50,
        },
        userStats: {
          avgWordLength: 5.2,
          minWordLength: 4,
          maxWordLength: 8,
          totalPoints: 85,
          wordsFoundCount: 12,
        },
      });
    });

    it('passes date and userId query params when provided', async () => {
      const mockApiResponse = {
        data: {
          date: '2026-08-20',
          global_stats: {
            avg_word_length: 4.0,
            min_word_length: 3,
            max_word_length: 7,
            total_points: 200,
            words_found_count: 25,
          },
          user_stats: null,
        },
      };

      mockApiInstance.get.mockResolvedValueOnce(mockApiResponse);

      const result = await fetchDailyStats('2026-08-20', 'user_123');

      expect(mockApiInstance.get).toHaveBeenCalledWith('/stats/daily', {
        params: {
          date: '2026-08-20',
          user_id: 'user_123',
        },
      });

      expect(result.userStats).toBeNull();
      expect(result.globalStats.avgWordLength).toBe(4.0);
    });
  });
});
