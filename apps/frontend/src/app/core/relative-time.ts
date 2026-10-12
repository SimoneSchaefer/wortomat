const UNITS: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

const format = new Intl.RelativeTimeFormat('de', { numeric: 'auto' });

/** „gerade eben“, „vor 5 Minuten“, „gestern“, „vor 3 Wochen“ … */
export function relativeTime(iso: string, now = Date.now()): string {
  const seconds = (new Date(iso).getTime() - now) / 1000;
  for (const [unit, unitSeconds] of UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return format.format(Math.trunc(seconds / unitSeconds), unit);
    }
  }
  return 'gerade eben';
}
