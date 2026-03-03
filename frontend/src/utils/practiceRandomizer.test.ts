import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { hasPracticeProgress, resetPracticeGame, PLATE_STORAGE_KEY } from './practiceRandomizer';
import { GameMode, STORAGE_KEY } from '@/constants/game';

const GUESSES_STORAGE_KEY = STORAGE_KEY[GameMode.PRACTICE];

describe('practiceRandomizer utilities', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Setup a clean QueryClient and spy on invalidation
    queryClient = new QueryClient();
    vi.spyOn(queryClient, 'invalidateQueries');

    // Clear localStorage to ensure a clean slate for every test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('hasPracticeProgress', () => {
    it('returns false when localStorage is empty', () => {
      expect(hasPracticeProgress()).toBe(false);
    });

    it('returns false when guesses are an empty array string', () => {
      localStorage.setItem(GUESSES_STORAGE_KEY, '[]');
      expect(hasPracticeProgress()).toBe(false);
    });

    it('returns true when there are actual guesses stored', () => {
      localStorage.setItem(GUESSES_STORAGE_KEY, '["APPLE", "PEAR"]');
      expect(hasPracticeProgress()).toBe(true);
    });

    it('returns true for a non-empty string that is NOT an empty array', () => {
      localStorage.setItem(GUESSES_STORAGE_KEY, 'some-raw-data');
      expect(hasPracticeProgress()).toBe(true);
    });
  });

  describe('resetPracticeGame', () => {
    it('removes all relevant keys from localStorage', () => {
      // Setup: Put data in storage
      localStorage.setItem(PLATE_STORAGE_KEY, 'XYZ');
      localStorage.setItem(GUESSES_STORAGE_KEY, '["WORD"]');

      // Execute
      resetPracticeGame(queryClient);

      // Verify: Everything is gone
      expect(localStorage.getItem(PLATE_STORAGE_KEY)).toBeNull();
      expect(localStorage.getItem(GUESSES_STORAGE_KEY)).toBeNull();
    });

    it('calls invalidateQueries with the correct query key', () => {
      resetPracticeGame(queryClient);

      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['randomPlate'],
      });
    });

    it('still works even if storage was already empty', () => {
      expect(() => resetPracticeGame(queryClient)).not.toThrow();
      expect(queryClient.invalidateQueries).toHaveBeenCalled();
    });
  });
});
