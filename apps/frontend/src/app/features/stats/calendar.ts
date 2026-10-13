import type { WritingDay } from '@wortomat/shared';

/** Untergrenzen der Farbstufen 1–5 (geschriebene Wörter am Tag). */
export const LEVEL_THRESHOLDS = [1, 250, 500, 1000, 2000] as const;

export interface CalendarDay {
  /** YYYY-MM-DD */
  day: string;
  /** Nach heute: Platzhalter am Ende der letzten Woche. */
  future: boolean;
  entry: WritingDay | null;
  /** 0 = nichts geschrieben, 1–5 nach `LEVEL_THRESHOLDS`. */
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
 * Wochen (Montag bis Sonntag) bis einschließlich der Woche von `today`, älteste zuerst.
 * Jede Woche hat 7 Tage; Tage nach heute sind als `future` markiert.
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

/** YYYY-MM-DD als Datum um Mitternacht Ortszeit. */
export function parseDay(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year!, month! - 1, date!);
}

export function formatDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Über den Kalender gezählt – sicher bei Sommer-/Winterzeit. */
function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** 0 = Montag … 6 = Sonntag */
function weekday(date: Date): number {
  return (date.getDay() + 6) % 7;
}
