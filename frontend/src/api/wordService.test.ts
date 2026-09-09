import { describe, it, expect, vi, afterEach } from 'vitest';
import { checkWordValidity, updateTierTimes } from './wordService';

// Mock the global fetch function
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

afterEach(() => {
  vi.clearAllMocks();
});

describe('checkWordValidity', () => {
  it('returns parsed JSON on a successful response without optional parameters', async () => {
    const mockResponse = { is_valid: true, message: 'Nice one! +13', points: 13 };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await checkWordValidity('leapfrog', 'lpg');

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/words/check'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: 'leapfrog',
          sequence: 'lpg',
        }),
      }),
    );
    expect(result).toEqual(mockResponse);
  });

  it('includes user_id, puzzle_date, and elapsed_seconds when provided', async () => {
    const mockResponse = { is_valid: true, message: 'Nice one! +13', points: 13 };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await checkWordValidity('leapfrog', 'lpg', 'user-123', '2026-08-11', 45);

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/words/check'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: 'leapfrog',
          sequence: 'lpg',
          user_id: 'user-123',
          puzzle_date: '2026-08-11',
          elapsed_seconds: 45,
        }),
      }),
    );
    expect(result).toEqual(mockResponse);
  });

  it('throws an error when the response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    });

    await expect(checkWordValidity('badword', 'xyz')).rejects.toThrow('Failed to check word');
  });
});

describe('updateTierTimes', () => {
  it('sends post payload to /words/tier-times and returns json response', async () => {
    const mockResponse = { success: true };
    const tierTimes = { bronze: 12, silver: 34, gold: 80 };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await updateTierTimes('user-123', '2026-08-11', tierTimes);

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/words/tier-times'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'user-123',
          puzzle_date: '2026-08-11',
          tier_times: tierTimes,
        }),
      }),
    );
    expect(result).toEqual(mockResponse);
  });

  it('throws an error when updateTierTimes fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    });

    await expect(updateTierTimes('user-123', '2026-08-11', { bronze: 12 })).rejects.toThrow(
      'Failed to update tier times',
    );
  });
});
