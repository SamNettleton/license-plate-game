import { describe, it, expect, vi, afterEach } from 'vitest';
import { checkWordValidity } from './wordService';

// Mock the global fetch function
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

afterEach(() => {
  vi.clearAllMocks();
});

describe('checkWordValidity', () => {
  it('returns parsed JSON on a successful response', async () => {
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
        body: JSON.stringify({ word: 'leapfrog', sequence: 'lpg' }),
      })
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
