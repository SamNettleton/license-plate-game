import { QueryClient } from '@tanstack/react-query';
import { GameMode, STORAGE_KEY } from '@/constants/game';

export const PLATE_STORAGE_KEY = 'lp_practice_current_plate';
const GUESSES_STORAGE_KEY = STORAGE_KEY[GameMode.PRACTICE];

/**
 * Checks if there is currently active game progress in Practice mode.
 * Used by the UI to decide if a confirmation modal is needed.
 */
export function hasPracticeProgress(): boolean {
  const progress = localStorage.getItem(GUESSES_STORAGE_KEY);
  // Returns true only if progress exists and isn't an empty array/string
  return !!progress && progress !== '[]';
}

/**
 * Performs the actual reset: clears storage and refreshes the data.
 */
export function resetPracticeGame(queryClient: QueryClient) {
  localStorage.removeItem(PLATE_STORAGE_KEY);
  localStorage.removeItem(GUESSES_STORAGE_KEY);

  // Triggers the tanstack query to fetch a brand new plate
  queryClient.invalidateQueries({ queryKey: ['randomPlate'] });
}
