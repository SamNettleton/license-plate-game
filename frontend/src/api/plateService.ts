import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

// Create an axios instance to avoid repeating the base URL
const api = axios.create({
  baseURL: BASE_URL,
});

export interface PlateChallenge {
  sequence: string;
  solutionsCount: number;
}

/**
 * Fetches a random 3-letter sequence and the total count of valid solutions.
 */
export const fetchRandomPlate = async (): Promise<PlateChallenge> => {
  // Axios returns the parsed JSON in the .data property
  const { data } = await api.get('/plate/random');
  // Transform the snake_case from the API to camelCase for the app
  return {
    sequence: data.sequence,
    solutionsCount: data.total_count,
  };
};

/**
 * Fetches the daily 3-letter sequence and the total count of valid solutions.
 */
export const fetchDailyPlate = async (): Promise<PlateChallenge> => {
  const { data } = await api.get('/plate/daily');
  // Transform the snake_case from the API to camelCase for the app
  return {
    sequence: data.sequence,
    solutionsCount: data.total_count,
  };
};
