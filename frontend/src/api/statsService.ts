import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
});

interface RawDailyStatMetrics {
  avg_word_length: number;
  min_word_length: number;
  max_word_length: number;
  total_points: number;
  words_found_count: number;
}

interface RawStatsResponse {
  date: string;
  global_stats: RawDailyStatMetrics;
  user_stats: RawDailyStatMetrics | null;
}

export interface DailyStatMetrics {
  avgWordLength: number;
  minWordLength: number;
  maxWordLength: number;
  totalPoints: number;
  wordsFoundCount: number;
}

export interface StatsResponse {
  date: string;
  globalStats: DailyStatMetrics;
  userStats: DailyStatMetrics | null;
}

export function normalizeDailyStatMetrics(raw: RawDailyStatMetrics): DailyStatMetrics {
  return {
    avgWordLength: raw.avg_word_length ?? 0,
    minWordLength: raw.min_word_length ?? 0,
    maxWordLength: raw.max_word_length ?? 0,
    totalPoints: raw.total_points ?? 0,
    wordsFoundCount: raw.words_found_count ?? 0,
  };
}

export async function fetchDailyStats(date?: string, userId?: string): Promise<StatsResponse> {
  const params: Record<string, string> = {};
  if (date) params.date = date;
  if (userId) params.user_id = userId;

  const { data } = await api.get<RawStatsResponse>('/stats/daily', { params });

  return {
    date: data.date,
    globalStats: normalizeDailyStatMetrics(data.global_stats),
    userStats: data.user_stats ? normalizeDailyStatMetrics(data.user_stats) : null,
  };
}
