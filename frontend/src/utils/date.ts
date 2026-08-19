export const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const toDateOnly = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const addDays = (date: Date, amount: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
};

export const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

export const daysInMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

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

/**
 * Returns the current date in UTC+14 (the earliest timezone on Earth).
 * A date is not "active anywhere" until UTC+14 reaches midnight of that date.
 */
export const getLatestActiveGlobalDate = () => {
  const now = new Date();
  const utc14Timestamp = now.getTime() + 14 * 60 * 60 * 1000;
  const utc14Date = new Date(utc14Timestamp);

  return new Date(utc14Date.getUTCFullYear(), utc14Date.getUTCMonth(), utc14Date.getUTCDate());
};
