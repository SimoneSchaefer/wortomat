import { Component, computed, inject, resource } from '@angular/core';
import { I18n } from '../../core/i18n/i18n';
import { WortomatApi } from '../../core/wortomat-api';
import {
  calendarWeeks,
  LEVEL_THRESHOLDS,
  parseDay,
  writingSummary,
  type CalendarDay,
} from './calendar';

/**
 * Schreibtage: Kennzahlen und Kalender des letzten Jahres aus dem Schreib-Log.
 * Die Tooltips (`data-tip`) zeigt die Statistikseite drumherum.
 */
@Component({
  selector: 'wm-writing-calendar',
  templateUrl: './writing-calendar.html',
  styleUrl: './writing-calendar.scss',
})
export class WritingCalendar {
  private readonly i18n = inject(I18n);
  protected readonly t = this.i18n.t;
  private readonly api = inject(WortomatApi);

  private readonly writing = resource({
    loader: async () => {
      // „Heute“ kommt vom Backend, denn dort beginnt der Tag erst um 4 Uhr.
      const { day: today } = await this.api.writingToday();
      const from = calendarWeeks(today, [])[0]![0]!.day;
      return { today, entries: await this.api.writingLog(from, today) };
    },
  });
  protected readonly calendar = computed(() => {
    const data = this.writing.value();
    if (!data) return null;
    const weeks = calendarWeeks(data.today, data.entries);
    // Monatsname über der ersten Woche, deren Montag im neuen Monat liegt
    const months = weeks.map((week, index) => {
      if (!index) return null;
      const monday = parseDay(week[0]!.day);
      const previous = parseDay(weeks[index - 1]![0]!.day);
      return monday.getMonth() === previous.getMonth() ? null : this.monthName(monday);
    });
    return {
      weeks,
      months,
      summary: writingSummary(data.today, data.entries),
      empty: !data.entries.length,
    };
  });
  /** Mo, Mi, Fr – wie üblich nur jede zweite Zeile beschriftet. */
  protected readonly weekdayLabels = computed(() => {
    const format = new Intl.DateTimeFormat(this.i18n.language(), { weekday: 'short' });
    // 5.10.2026 ist ein Montag
    return [0, 2, 4].map((offset) => ({
      row: offset + 2,
      label: format.format(new Date(2026, 9, 5 + offset)),
    }));
  });
  protected readonly levels = LEVEL_THRESHOLDS.map((from, index) => ({
    level: index + 1,
    from,
    to: index + 1 < LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[index + 1]! - 1 : null,
  }));

  protected dayTip(day: CalendarDay): string {
    const date = new Intl.DateTimeFormat(this.i18n.language(), {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(parseDay(day.day));
    const entry = day.entry;
    return this.t().stats.dayTip(date, entry?.added ?? 0, entry?.removed ?? 0, entry?.pasted ?? 0);
  }

  protected bestDayLabel(day: string): string {
    return new Intl.DateTimeFormat(this.i18n.language(), { day: 'numeric', month: 'short' }).format(
      parseDay(day),
    );
  }

  private monthName(date: Date): string {
    return new Intl.DateTimeFormat(this.i18n.language(), { month: 'short' }).format(date);
  }
}
