import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
});

export type LeaderboardEntry = {
  rank: number;
  name: string;
  score: number;
  solvedWords: number;
  userId?: string;
  isCurrentUser?: boolean;
};

export type LeaderboardResponse = {
  date: string;
  entries: LeaderboardEntry[];
  currentUser?: LeaderboardEntry;
};

export const fetchDailyLeaderboard = async (
  date: string,
  userId?: string,
  limit = 10,
): Promise<LeaderboardResponse> => {
  const { data } = await api.get('/leaderboard/daily', {
    params: {
      date,
      user_id: userId,
      limit,
    },
  });

  return {
    date: data.date,
    entries: (data.entries ?? []).map((entry: any) => ({
      rank: entry.rank,
      name: entry.name,
      score: entry.score ?? entry.points_earned ?? 0,
      solvedWords: entry.solved_words ?? entry.solvedWords ?? 0,
      userId: entry.user_id ?? entry.userId,
      isCurrentUser: Boolean(entry.is_current_user ?? entry.isCurrentUser),
    })),
    currentUser: data.current_user
      ? {
          rank: data.current_user.rank,
          name: data.current_user.name,
          score: data.current_user.score ?? 0,
          solvedWords: data.current_user.solved_words ?? 0,
          userId: data.current_user.user_id,
          isCurrentUser: true,
        }
      : undefined,
  };
};
