export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Parse a YYYY-MM-DD string into a UTC-noon Date (timezone-safe for key maths). */
export function parseDateKey(value) {
  if (!DATE_PATTERN.test(value ?? '')) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

export function isValidDateKey(value) {
  return parseDateKey(value) !== null;
}

export function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

export function todayKey(now = new Date()) {
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function dayKeyFromDate(date) {
  // JS getUTCDay: 0 = Sunday. DAY_KEYS starts at Monday.
  return DAY_KEYS[(date.getUTCDay() + 6) % 7];
}

export function dayKeyFromDateKey(dateKey) {
  const date = parseDateKey(dateKey);
  return date ? dayKeyFromDate(date) : null;
}

export function addDays(dateKeyOrDate, amount) {
  const date =
    typeof dateKeyOrDate === 'string' ? parseDateKey(dateKeyOrDate) : new Date(dateKeyOrDate);
  date.setUTCDate(date.getUTCDate() + amount);
  return formatDateKey(date);
}

export function startOfWeek(dateKey) {
  const date = parseDateKey(dateKey);
  const offset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - offset);
  return formatDateKey(date);
}

export function eachDate(fromKey, toKey) {
  const days = [];
  let cursor = fromKey;
  while (cursor <= toKey) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return days;
}

export function isDateKeyWithin(dateKey, baseKey, dayRadius = 1) {
  return dateKey >= addDays(baseKey, -dayRadius) && dateKey <= addDays(baseKey, dayRadius);
}
