/**
 * Formats a duration in seconds into "M:SS" or "H:MM:SS" (if >= 1 hour).
 */
export function formatTime(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '0:00';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const formattedSeconds = seconds.toString().padStart(2, '0');

  if (hours > 0) {
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${hours}:${formattedMinutes}:${formattedSeconds}`;
  }

  return `${minutes}:${formattedSeconds}`;
}
