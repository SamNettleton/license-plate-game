import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { fetchDailyLeaderboard } from './leaderboardService';

vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
  };
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

describe('fetchDailyLeaderboard', () => {
  let mockGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    const api = axios.create();
    mockGet = api.get as ReturnType<typeof vi.fn>;
  });

  it('fetches leaderboard data with correct query parameters and default limit', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        date: '2026-08-18',
        entries: [],
        current_user: null,
      },
    });

    await fetchDailyLeaderboard('2026-08-18', 'user-123');

    expect(mockGet).toHaveBeenCalledWith('/leaderboard/daily', {
      params: {
        date: '2026-08-18',
        user_id: 'user-123',
        limit: 10,
      },
    });
  });

  it('allows overriding the limit parameter', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        date: '2026-08-18',
        entries: [],
        current_user: null,
      },
    });

    await fetchDailyLeaderboard('2026-08-18', 'user-123', 25);

    expect(mockGet).toHaveBeenCalledWith('/leaderboard/daily', {
      params: {
        date: '2026-08-18',
        user_id: 'user-123',
        limit: 25,
      },
    });
  });

  it('correctly maps snake_case backend properties to camelCase frontend properties', async () => {
    const mockApiResponse = {
      date: '2026-08-18',
      entries: [
        {
          rank: 1,
          name: 'Top Player',
          score: 1200,
          solved_words: 15,
          user_id: 'user-top',
          is_current_user: false,
        },
      ],
      current_user: {
        rank: 14,
        name: 'Outside Player',
        score: 450,
        solved_words: 5,
        user_id: 'user-me',
      },
    };

    mockGet.mockResolvedValueOnce({ data: mockApiResponse });

    const result = await fetchDailyLeaderboard('2026-08-18', 'user-me');

    expect(result).toEqual({
      date: '2026-08-18',
      entries: [
        {
          rank: 1,
          name: 'Top Player',
          score: 1200,
          solvedWords: 15,
          userId: 'user-top',
          isCurrentUser: false,
        },
      ],
      currentUser: {
        rank: 14,
        name: 'Outside Player',
        score: 450,
        solvedWords: 5,
        userId: 'user-me',
        isCurrentUser: true,
      },
    });
  });

  it('handles field name fallbacks and missing entries gracefully', async () => {
    const mockApiResponseWithFallbacks = {
      date: '2026-08-18',
      entries: [
        {
          rank: 2,
          name: 'Alternative Schema Player',
          points_earned: 800,
          solvedWords: 8,
          userId: 'user-alt',
          isCurrentUser: true,
        },
      ],
      current_user: null,
    };

    mockGet.mockResolvedValueOnce({ data: mockApiResponseWithFallbacks });

    const result = await fetchDailyLeaderboard('2026-08-18');

    expect(result.entries[0]).toEqual({
      rank: 2,
      name: 'Alternative Schema Player',
      score: 800,
      solvedWords: 8,
      userId: 'user-alt',
      isCurrentUser: true,
    });
    expect(result.currentUser).toBeUndefined();
  });

  it('handles empty response payload safely', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        date: '2026-08-18',
      },
    });

    const result = await fetchDailyLeaderboard('2026-08-18');

    expect(result).toEqual({
      date: '2026-08-18',
      entries: [],
      currentUser: undefined,
    });
  });

  it('propagates errors when the API request fails', async () => {
    const apiError = new Error('Network Error');
    mockGet.mockRejectedValueOnce(apiError);

    await expect(fetchDailyLeaderboard('2026-08-18')).rejects.toThrow('Network Error');
  });
});
