interface ZonedParts {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timezone: string): Intl.DateTimeFormat {
  const existing = formatterCache.get(timezone);
  if (existing) return existing;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  formatterCache.set(timezone, formatter);
  return formatter;
}

export function getZonedParts(instant: string | Date, timezone: string): ZonedParts {
  const date = typeof instant === 'string' ? new Date(instant) : instant;
  const values = new Map(
    getFormatter(timezone)
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: values.get('year') ?? 0,
    month: values.get('month') ?? 0,
    day: values.get('day') ?? 0,
    hour: values.get('hour') ?? 0,
    minute: values.get('minute') ?? 0,
    second: values.get('second') ?? 0,
  };
}

export function wallTimeToUtc(parts: ZonedParts, timezone: string): string {
  const wallTime = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  let guess = wallTime;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const actual = getZonedParts(new Date(guess), timezone);
    const actualWallTime = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    );
    const correction = wallTime - actualWallTime;
    if (correction === 0) break;
    guess += correction;
  }
  return new Date(guess).toISOString();
}

export function zonedDateKey(instant: string | Date, timezone: string): string {
  const parts = getZonedParts(instant, timezone);
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

export function startOfZonedDay(instant: string, timezone: string): string {
  const parts = getZonedParts(instant, timezone);
  return wallTimeToUtc({ ...parts, hour: 0, minute: 0, second: 0 }, timezone);
}

export function addWallDays(parts: ZonedParts, amount: number): ZonedParts {
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + amount, parts.hour, parts.minute, parts.second));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
  };
}

