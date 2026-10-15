import { relativeTime } from './relative-time';

describe('relativeTime', () => {
  const now = Date.parse('2026-10-12T12:00:00Z');
  const ago = (seconds: number) => new Date(now - seconds * 1000).toISOString();

  it('formats in German', () => {
    expect(relativeTime(ago(10), 'de', now)).toBe('gerade eben');
    expect(relativeTime(ago(5 * 60), 'de', now)).toBe('vor 5 Minuten');
    expect(relativeTime(ago(36 * 3600), 'de', now)).toBe('gestern');
    expect(relativeTime(ago(3 * 24 * 3600), 'de', now)).toBe('vor 3 Tagen');
    expect(relativeTime(ago(15 * 24 * 3600), 'de', now)).toBe('vor 2 Wochen');
  });

  it('formats in English', () => {
    expect(relativeTime(ago(10), 'en', now)).toBe('just now');
    expect(relativeTime(ago(5 * 60), 'en', now)).toBe('5 minutes ago');
    expect(relativeTime(ago(36 * 3600), 'en', now)).toBe('yesterday');
  });
});
