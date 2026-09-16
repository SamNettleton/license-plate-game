import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
});

export interface RawDailySummaryArchiveItem {
  date: string;
  sequence: string;
  goal_points: number;
  points_earned: number;
  words_found: string[];
  elapsed_seconds: number;
  tier_times: Record<string, number>;
}

export interface RawMonthlyArchiveResponse {
  user_id: string;
  year: number;
  month: number;
  summaries: RawDailySummaryArchiveItem[];
}

export interface DailySummaryArchiveItem {
  date: string;
  sequence: string;
  goalPoints: number;
  pointsEarned: number;
  wordsFound: string[];
  elapsedSeconds: number;
  tierTimes: Record<string, number>;
}

export interface MonthlyArchiveResponse {
  userId: string;
  year: number;
  month: number;
  summaries: DailySummaryArchiveItem[];
}

export function normalizeArchiveItem(rawItem: RawDailySummaryArchiveItem): DailySummaryArchiveItem {
  return {
    date: rawItem.date,
    sequence: rawItem.sequence,
    goalPoints: rawItem.goal_points ?? 0,
    pointsEarned: rawItem.points_earned ?? 0,
    wordsFound: rawItem.words_found ?? [],
    elapsedSeconds: rawItem.elapsed_seconds ?? 0,
    tierTimes: rawItem.tier_times ?? {},
  };
}

export const fetchMonthlyArchive = async (
  userId: string,
  year: number,
  month: number,
): Promise<MonthlyArchiveResponse> => {
  const { data } = await api.get<RawMonthlyArchiveResponse>(`/archive/users/${userId}`, {
    params: {
      year,
      month,
    },
  });

  return {
    userId: data.user_id,
    year: data.year,
    month: data.month,
    summaries: (data.summaries ?? []).map(normalizeArchiveItem),
  };
};
