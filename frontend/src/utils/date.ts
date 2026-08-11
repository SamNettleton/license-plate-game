/**
 * Returns current date in YYYY-MM-DD format using local client time
 * without timezone shifting issues.
 */
export const getLocalDailyDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
