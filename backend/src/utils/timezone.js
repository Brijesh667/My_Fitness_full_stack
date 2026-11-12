const formatterCache = new Map();

function getFormatter(timeZone) {
  if (!formatterCache.has(timeZone)) {
    formatterCache.set(
      timeZone,
      new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    );
  }
  return formatterCache.get(timeZone);
}

export function zonedParts(date, timeZone) {
  const parts = Object.fromEntries(
    getFormatter(timeZone)
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: parts.hour === '24' ? 0 : Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second)
  };
}

export function dateKeyInTimeZone(date, timeZone) {
  const parts = zonedParts(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

function offsetMs(date, timeZone) {
  const parts = zonedParts(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - date.getTime();
}

function zonedDateTimeToUtc(parts, timeZone) {
  const guess = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  let result = guess;
  for (let index = 0; index < 3; index += 1) {
    result = guess - offsetMs(new Date(result), timeZone);
  }
  return new Date(result);
}

/** Instant of the next local midnight in the given IANA timezone. */
export function nextResetAt(now, timeZone) {
  const local = zonedParts(now, timeZone);
  const nextWall = new Date(Date.UTC(local.year, local.month - 1, local.day + 1, 0, 0, 0));
  return zonedDateTimeToUtc(
    {
      year: nextWall.getUTCFullYear(),
      month: nextWall.getUTCMonth() + 1,
      day: nextWall.getUTCDate(),
      hour: 0,
      minute: 0,
      second: 0
    },
    timeZone
  );
}

export function secondsUntil(date, now = new Date()) {
  return Math.max(1, Math.ceil((date.getTime() - now.getTime()) / 1000));
}
