const BASE_URL = import.meta.env.VITE_API_URL;

export const checkWordValidity = async (
  word: string,
  sequence: string,
  userId?: string | null,
  puzzleDate?: string | null,
) => {
  const body: Record<string, unknown> = { word, sequence };
  if (userId !== undefined) body.user_id = userId;
  if (puzzleDate !== undefined) body.puzzle_date = puzzleDate;

  const response = await fetch(`${BASE_URL}/words/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error('Failed to check word');
  return response.json();
};
