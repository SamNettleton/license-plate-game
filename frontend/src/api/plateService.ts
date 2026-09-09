import axios from 'axios';
import { getLocalDailyDate } from '@/utils/date';

const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
});

export interface PlateChallenge {
  sequence: string;
  solutionsCount: number;
  goalPoints: number;
  wordsFound: string[];
  pointsEarned: number;
  elapsedSeconds: number;
  tierTimes: Record<string, number>;
}

/**
 * DEPRECATED: Fetches a random 3-letter sequence and the total count of valid solutions.
 * Practice mode has been removed from the game, so this function is no longer used, but may be used in the future.
 */
// export const fetchRandomPlate = async (): Promise<PlateChallenge> => {
//   // Axios returns the parsed JSON in the .data property
//   const { data } = await api.get('/plate/random');
//   // Transform the snake_case from the API to camelCase for the app
//   return {
//     sequence: data.sequence,
//     solutionsCount: data.total_count,
//     goalPoints: data.goal_points,
//   };
// };

/**
 * Fetches the daily 3-letter sequence and the total count of valid solutions.
 */
export const fetchDailyPlate = async (userId?: string, date?: string): Promise<PlateChallenge> => {
  const queryDate = date || getLocalDailyDate();
  const params = new URLSearchParams({ date: queryDate });

  if (userId) {
    params.append('user_id', userId);
  }

  const { data } = await api.get(`/plate/daily?${params.toString()}`);

  return {
    sequence: data.sequence,
    solutionsCount: data.total_count,
    goalPoints: data.goal_points,
    wordsFound: data.words_found || [],
    pointsEarned: data.points_earned || 0,
    elapsedSeconds: data.elapsed_seconds || 0,
    tierTimes: data.tier_times || {},
  };
};
