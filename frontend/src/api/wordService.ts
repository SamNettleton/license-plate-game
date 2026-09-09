const BASE_URL = import.meta.env.VITE_API_URL;

export const checkWordValidity = async (
  word: string,
  sequence: string,
  userId?: string | null,
  puzzleDate?: string | null,
  elapsedSeconds?: number,
) => {
  const body: Record<string, unknown> = { word, sequence };
  if (userId !== undefined) body.user_id = userId;
  if (puzzleDate !== undefined) body.puzzle_date = puzzleDate;
  if (elapsedSeconds !== undefined) body.elapsed_seconds = elapsedSeconds;

  const response = await fetch(`${BASE_URL}/words/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error('Failed to check word');
  return response.json();
};

export const updateTierTimes = async (
  userId: string,
  puzzleDate: string,
  tierTimes: Record<string, number>,
) => {
  const response = await fetch(`${BASE_URL}/words/tier-times`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      puzzle_date: puzzleDate,
      tier_times: tierTimes,
    }),
  });

  if (!response.ok) throw new Error('Failed to update tier times');
  return response.json();
};
