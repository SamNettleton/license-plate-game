const BASE_URL = import.meta.env.VITE_API_URL;

export const checkWordValidity = async (word: string, sequence: string) => {
  const response = await fetch(`${BASE_URL}/words/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, sequence }),
  });

  if (!response.ok) throw new Error('Failed to check word');
  return response.json();
};
