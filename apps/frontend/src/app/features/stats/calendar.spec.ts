import type { WritingDay } from '@wortomat/shared';
import { calendarWeeks, level, writingSummary } from './calendar';

function day(date: string, added: number): WritingDay {
  return { day: date, added, removed: 0, pasted: 0 };
}

describe('calendarWeeks', () => {
  // 13 Oct 2026 is a Tuesday
  const weeks = calendarWeeks('2026-10-13', [day('2026-10-13', 600), day('2026-10-05', 10)], 2);

  it('beginnt jede Woche am Montag und endet mit der Woche von heute', () => {
    expect(weeks.map((week) => week[0]!.day)).toEqual(['2026-10-05', '2026-10-12']);
    expect(weeks[1]!.map((d) => d.future)).toEqual([false, false, true, true, true, true, true]);
  });

  it('ordnet die Einträge den Tagen zu und stuft sie ein', () => {
    expect(weeks[0]![0]).toMatchObject({ day: '2026-10-05', level: 1 });
    expect(weeks[1]![1]).toMatchObject({ day: '2026-10-13', level: 3 });
    expect(weeks[1]![0]).toMatchObject({ entry: null, level: 0 });
  });

  it('zählt über die Zeitumstellung hinweg richtig', () => {
    // 25 Oct 2026: end of daylight saving time in Europe
    const days = calendarWeeks('2026-10-28', [], 2)
      .flat()
      .map((d) => d.day);
    expect(days).toContain('2026-10-25');
    expect(days).toContain('2026-10-26');
    expect(new Set(days).size).toBe(14);
  });
});

describe('level', () => {
  it('stuft nach festen Schwellen ein', () => {
    expect([0, 1, 249, 250, 999, 1000, 5000].map(level)).toEqual([0, 1, 1, 2, 3, 4, 5]);
  });
});

describe('writingSummary', () => {
  it('summiert heute, 7 und 30 Tage und findet den besten Tag', () => {
    const summary = writingSummary('2026-10-13', [
      day('2026-09-01', 3000),
      day('2026-09-20', 100),
      day('2026-10-07', 200),
      day('2026-10-13', 50),
    ]);
    expect(summary).toEqual({
      today: 50,
      last7: 250,
      last30: 350,
      best: day('2026-09-01', 3000),
    });
  });
});
