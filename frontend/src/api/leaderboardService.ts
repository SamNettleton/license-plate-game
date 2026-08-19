import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
});

export interface RawLeaderboardEntry {
  rank?: number;
  name?: string;
  score?: number;
  words_found_count?: number;
  user_id?: string;
  is_current_user?: boolean;
}

export interface RawLeaderboardResponse {
  date: string;
  entries: RawLeaderboardEntry[];
  current_user?: RawLeaderboardEntry;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  wordsFoundCount: number;
  userId?: string;
  isCurrentUser: boolean;
}

export interface LeaderboardResponse {
  date: string;
  entries: LeaderboardEntry[];
  currentUser?: LeaderboardEntry;
}

export function normalizeLeaderboardEntry(
  rawEntry: RawLeaderboardEntry,
  currentUserId?: string,
): LeaderboardEntry {
  const {
    user_id: userId,
    name = 'Unknown Player',
    rank = 0,
    score = 0,
    words_found_count: wordsFoundCount = 0,
    is_current_user: isCurrentUser,
  } = rawEntry;

  return {
    userId,
    name,
    rank,
    score,
    wordsFoundCount,
    isCurrentUser: isCurrentUser ?? (Boolean(currentUserId) && currentUserId === userId),
  };
}

export const fetchDailyLeaderboard = async (
  date: string,
  userId?: string,
  limit = 10,
): Promise<LeaderboardResponse> => {
  const { data } = await api.get<RawLeaderboardResponse>('/leaderboard/daily', {
    params: {
      date,
      user_id: userId,
      limit,
    },
  });

  return {
    date: data.date,
    entries: (data.entries ?? []).map((entry) => normalizeLeaderboardEntry(entry, userId)),
    currentUser: data.current_user
      ? normalizeLeaderboardEntry(data.current_user, userId)
      : undefined,
  };
};
