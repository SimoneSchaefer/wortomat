import type { WritingDay } from '@wortomat/shared';

/** Lower bounds of colour levels 1–5 (words written per day). */
export const LEVEL_THRESHOLDS = [1, 250, 500, 1000, 2000] as const;

export interface CalendarDay {
  /** YYYY-MM-DD */
  day: string;
  /** After today: placeholders at the end of the last week. */
  future: boolean;
  entry: WritingDay | null;
  /** 0 = nothing written, 1–5 by `LEVEL_THRESHOLDS`. */
  level: number;
}

export interface WritingSummary {
  today: number;
  last7: number;
  last30: number;
  best: WritingDay | null;
}

export function level(words: number): number {
  let result = 0;
  LEVEL_THRESHOLDS.forEach((threshold, index) => {
    if (words >= threshold) result = index + 1;
  });
  return result;
}

/**
 * Weeks (Monday to Sunday) up to and including the week of `today`, oldest first. Every week has 7
 * days; days after today are marked as `future`.
 */
export function calendarWeeks(
  today: string,
  entries: readonly WritingDay[],
  weeks = 53,
): CalendarDay[][] {
  const byDay = new Map(entries.map((entry) => [entry.day, entry]));
  const end = parseDay(today);
  const start = addDays(end, -weekday(end) - (weeks - 1) * 7);
  const result: CalendarDay[][] = [];
  for (let week = 0; week < weeks; week++) {
    const days: CalendarDay[] = [];
    for (let index = 0; index < 7; index++) {
      const date = addDays(start, week * 7 + index);
      const day = formatDay(date);
      const entry = byDay.get(day) ?? null;
      days.push({ day, future: date > end, entry, level: level(entry?.added ?? 0) });
    }
    result.push(days);
  }
  return result;
}

export function writingSummary(today: string, entries: readonly WritingDay[]): WritingSummary {
  const end = parseDay(today);
  const since = (days: number) => formatDay(addDays(end, -(days - 1)));
  const sum = (from: string) =>
    entries
      .filter((entry) => entry.day >= from && entry.day <= today)
      .reduce((total, entry) => total + entry.added, 0);
  const best = entries.reduce<WritingDay | null>(
    (top, entry) => (entry.added > (top?.added ?? 0) ? entry : top),
    null,
  );
  return { today: sum(today), last7: sum(since(7)), last30: sum(since(30)), best };
}

/** At midnight local time. */
export function parseDay(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year!, month! - 1, date!);
}

export function formatDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Counted by calendar – safe across daylight saving changes. */
function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** 0 = Monday … 6 = Sunday */
function weekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}
