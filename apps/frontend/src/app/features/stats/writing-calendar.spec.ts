import { de } from '../../core/i18n/de';
import { FakeApi } from '../../testing/fake-api';
import { render, text, until } from '../../testing/render';
import { WritingCalendar } from './writing-calendar';

const S = de.stats;

async function setup(prepare: (api: FakeApi) => void = () => undefined) {
  const api = new FakeApi();
  api.today = '2026-10-15';
  prepare(api);
  const view = await render(WritingCalendar, { api });
  await until(view.settle, () => !!view.element.querySelector('.figures'));
  const figure = (label: string) =>
    text(
      [...view.element.querySelectorAll('.figures > div')]
        .find((d) => text(d.querySelector('dt')) === label)
        ?.querySelector('dd'),
    );
  const day = (date: string) =>
    [...view.element.querySelectorAll<HTMLElement>('.calendar .cell')].find((cell) =>
      cell.getAttribute('data-tip')?.includes(date),
    );
  return { ...view, api, figure, day };
}

describe('WritingCalendar', () => {
  it('asks the backend for "today", because the day starts at 4 am there', async () => {
    const { api } = await setup();
    expect(api.writingToday).toHaveBeenCalled();
    expect(api.writingLog.mock.calls[0]![1]).toBe('2026-10-15');
  });

  it('sums today, the last 7 and 30 days and names the best day', async () => {
    const { figure } = await setup((api) => {
      api.writing = [
        { day: '2026-10-15', added: 300, removed: 20, pasted: 0 },
        { day: '2026-10-12', added: 1200, removed: 0, pasted: 50 },
        { day: '2026-09-25', added: 500, removed: 0, pasted: 0 },
        { day: '2026-08-01', added: 9000, removed: 0, pasted: 0 },
      ];
    });
    expect(figure(S.writingToday)).toBe('300');
    expect(figure(S.writingLast7)).toBe('1.500');
    expect(figure(S.writingLast30)).toBe('2.000');
    expect(figure(S.writingBest)).toMatch(/^9\.000 /);
  });

  it('colours each day by how much was written and explains it in the tooltip', async () => {
    const { day } = await setup((api) => {
      api.writing = [{ day: '2026-10-12', added: 1200, removed: 30, pasted: 50 }];
    });
    const cell = day('12. Okt.')!;
    expect(cell.getAttribute('data-level')).toBe('4');
    expect(cell.getAttribute('data-tip')).toContain(
      '1.200 geschrieben · 30 gestrichen · 50 eingefügt',
    );
  });

  it('notes that nothing has been recorded yet', async () => {
    const { element, figure } = await setup();
    expect(text(element.querySelector('.calendar-foot'))).toContain(S.writingEmpty);
    expect(figure(S.writingBest)).toBe('–');
  });
});
