import type { Language } from '@wortomat/shared';

const UNITS: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

const JUST_NOW: Record<Language, string> = { de: 'gerade eben', en: 'just now' };

/** „gerade eben“, „vor 5 Minuten“, „gestern“, „vor 3 Wochen“ … (bzw. „5 minutes ago“ …) */
export function relativeTime(iso: string, language: Language, now = Date.now()): string {
  const seconds = (new Date(iso).getTime() - now) / 1000;
  const format = new Intl.RelativeTimeFormat(language, { numeric: 'auto' });
  for (const [unit, unitSeconds] of UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return format.format(Math.trunc(seconds / unitSeconds), unit);
    }
  }
  return JUST_NOW[language];
}
