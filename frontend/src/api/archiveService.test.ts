import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import {
  normalizeArchiveItem,
  fetchMonthlyArchive,
  RawDailySummaryArchiveItem,
  RawMonthlyArchiveResponse,
} from './archiveService';

vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn().mockReturnValue({
        get: vi.fn(),
      }),
    },
  };
});

describe('archiveService', () => {
  const mockedAxios = axios.create() as unknown as {
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normalizeArchiveItem', () => {
    it('should correctly map raw snake_case properties to camelCase', () => {
      const rawItem: RawDailySummaryArchiveItem = {
        date: '2026-08-11',
        sequence: 'ABC',
        goal_points: 100,
        points_earned: 45,
        words_found: ['leap', 'frog'],
        elapsed_seconds: 120,
        tier_times: { Novice: 10, Wordsmith: 45 },
      };

      const normalized = normalizeArchiveItem(rawItem);

      expect(normalized).toEqual({
        date: '2026-08-11',
        sequence: 'ABC',
        goalPoints: 100,
        pointsEarned: 45,
        wordsFound: ['leap', 'frog'],
        elapsedSeconds: 120,
        tierTimes: { Novice: 10, Wordsmith: 45 },
      });
    });

    it('should handle null/undefined fields using fallback defaults', () => {
      const rawItem = {
        date: '2026-08-11',
        sequence: null,
        goal_points: null,
        points_earned: null,
        words_found: null,
        elapsed_seconds: null,
        tier_times: null,
      } as unknown as RawDailySummaryArchiveItem;

      const normalized = normalizeArchiveItem(rawItem);

      expect(normalized).toEqual({
        date: '2026-08-11',
        sequence: null,
        goalPoints: 0,
        pointsEarned: 0,
        wordsFound: [],
        elapsedSeconds: 0,
        tierTimes: {},
      });
    });
  });

  describe('fetchMonthlyArchive', () => {
    it('should fetch monthly summaries and normalize the payload', async () => {
      const userId = 'user-1234';
      const year = 2026;
      const month = 8;

      const mockResponse: RawMonthlyArchiveResponse = {
        user_id: userId,
        year,
        month,
        summaries: [
          {
            date: '2026-08-11',
            sequence: 'ABC',
            goal_points: 50,
            points_earned: 25,
            words_found: ['frog'],
            elapsed_seconds: 60,
            tier_times: { Novice: 5 },
          },
        ],
      };

      mockedAxios.get.mockResolvedValueOnce({ data: mockResponse });

      const result = await fetchMonthlyArchive(userId, year, month);

      expect(mockedAxios.get).toHaveBeenCalledWith(`/archive/users/${userId}`, {
        params: { year, month },
      });
      expect(result).toEqual({
        userId,
        year,
        month,
        summaries: [
          {
            date: '2026-08-11',
            sequence: 'ABC',
            goalPoints: 50,
            pointsEarned: 25,
            wordsFound: ['frog'],
            elapsedSeconds: 60,
            tierTimes: { Novice: 5 },
          },
        ],
      });
    });

    it('should fallback gracefully when summaries array is missing or empty', async () => {
      const userId = 'user-1234';
      const year = 2026;
      const month = 8;

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          user_id: userId,
          year,
          month,
          summaries: null,
        },
      });

      const result = await fetchMonthlyArchive(userId, year, month);

      expect(result.summaries).toEqual([]);
    });

    it('should throw an error when API call fails', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

      await expect(fetchMonthlyArchive('user-1234', 2026, 8)).rejects.toThrow('Network Error');
    });
  });
});
