/**
 * One place to read backend timestamps (build-readiness review M11).
 *
 * - API key `created_at` is ISO WITHOUT a zone, written from the server's UTC clock;
 *   `new Date()` would read it as local time, so a zone-less value is taken as UTC.
 * - Webhook timestamps carry a zone and pass through unchanged.
 * - API key `last_used` is already a server-humanized string ("2 hours ago"); it is not a
 *   timestamp and is shown as-is by the caller.
 */
const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i;

export function parseUtc(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const raw = value.trim();
  const iso = HAS_ZONE.test(raw) ? raw : `${raw.replace(' ', 'T')}Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const dateTimeFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

const dateTimeSecondsFmt = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'UTC',
});

/** "Oct 22, 03:39:07" (UTC, no suffix: for tables headed "Times in UTC"). */
export function formatDateTimeSecondsUtc(value: unknown, fallback = '—') {
  const date = parseUtc(value);
  return date ? dateTimeSecondsFmt.format(date) : fallback;
}

/** "Nov 12, 2026" (UTC). */
export function formatDateUtc(value: unknown, fallback = '—') {
  const date = parseUtc(value);
  return date ? dateFmt.format(date) : fallback;
}

/** "Nov 12, 14:05 UTC". */
export function formatDateTimeUtc(value: unknown, fallback = '—') {
  const date = parseUtc(value);
  return date ? `${dateTimeFmt.format(date)} UTC` : fallback;
}

/** "in 5 min", "in 2 h", "3 min ago" relative to now. */
export function formatRelative(value: unknown, now: number = Date.now(), fallback = '—') {
  const date = parseUtc(value);
  if (!date) return fallback;
  const deltaSeconds = Math.round((date.getTime() - now) / 1000);
  const abs = Math.abs(deltaSeconds);
  const phrase =
    abs < 60 ? 'under a minute' : abs < 3600 ? `${Math.round(abs / 60)} min` : abs < 86400 ? `${Math.round(abs / 3600)} h` : `${Math.round(abs / 86400)} d`;
  if (abs < 60) return deltaSeconds >= 0 ? 'in under a minute' : 'just now';
  return deltaSeconds >= 0 ? `in ${phrase}` : `${phrase} ago`;
}
