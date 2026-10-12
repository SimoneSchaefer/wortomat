import { relativeTime } from './relative-time';

describe('relativeTime', () => {
  const now = Date.parse('2026-10-12T12:00:00Z');
  const ago = (seconds: number) => new Date(now - seconds * 1000).toISOString();

  it('formatiert auf Deutsch', () => {
    expect(relativeTime(ago(10), now)).toBe('gerade eben');
    expect(relativeTime(ago(5 * 60), now)).toBe('vor 5 Minuten');
    expect(relativeTime(ago(36 * 3600), now)).toBe('gestern');
    expect(relativeTime(ago(3 * 24 * 3600), now)).toBe('vor 3 Tagen');
    expect(relativeTime(ago(15 * 24 * 3600), now)).toBe('vor 2 Wochen');
  });
});
