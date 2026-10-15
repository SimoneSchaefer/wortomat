import type { MapStroke } from '@wortomat/shared';
import { hitsStroke, simplify, smooth, strokePath } from './map-drawing';

describe('strokePath', () => {
  it('smooths through the midpoints and closes areas', () => {
    expect(strokePath([0, 0, 10, 0, 10, 10])).toBe('M0 0Q10 0 10 5L10 10');
    expect(strokePath([0, 0, 10, 0, 10, 10], true)).toBe('M0 0Q10 0 10 5L10 10Z');
  });

  it('shows a single point as a tiny stroke', () => {
    expect(strokePath([5, 5])).toBe('M5 5h0.1');
    expect(strokePath([])).toBe('');
  });
});

describe('simplify', () => {
  it('drops points on a straight line, keeps corners', () => {
    expect(simplify([0, 0, 5, 0.1, 10, 0, 10, 10], 0.5)).toEqual([0, 0, 10, 0, 10, 10]);
  });

  it('leaves short strokes unchanged', () => {
    expect(simplify([1, 2, 3, 4], 5)).toEqual([1, 2, 3, 4]);
  });
});

describe('smooth', () => {
  it('smooths jitter but keeps start and end', () => {
    // zigzag around the line y = 0
    const jagged = Array.from({ length: 41 }, (_, i) => [i * 5, i % 2 ? 4 : -4]).flat();
    const result = smooth(jagged, 5, 4);
    expect(result.slice(0, 2)).toEqual([0, -4]);
    expect(result.slice(-2)).toEqual([200, -4]);
    const middle = result.filter((_, i) => i % 2 === 1).slice(5, -5);
    expect(Math.max(...middle.map(Math.abs))).toBeLessThan(1);
  });

  it('spreads the points evenly', () => {
    expect(smooth([0, 0, 10, 0], 2.5, 0)).toEqual([0, 0, 2.5, 0, 5, 0, 7.5, 0, 10, 0]);
  });

  it('smooths areas across the seam too', () => {
    const square = [0, 0, 100, 0, 100, 100, 0, 100, 0, 0];
    const result = smooth(square, 10, 3, true);
    // the corner at the start is rounded too
    expect(result[0]).toBeGreaterThan(0);
  });
});

describe('hitsStroke', () => {
  const line: MapStroke = { tool: 'pen', color: '#000000', width: 4, points: [0, 0, 100, 0] };
  const square: MapStroke = { ...line, tool: 'area', points: [0, 0, 100, 0, 100, 100, 0, 100] };

  it('hits lines including their width', () => {
    expect(hitsStroke(line, 50, 6, 4)).toBe(true);
    expect(hitsStroke(line, 50, 7, 4)).toBe(false);
    expect(hitsStroke(line, 106, 0, 4)).toBe(true);
  });

  it('hits areas in the middle too – lines not', () => {
    expect(hitsStroke(square, 50, 50, 1)).toBe(true);
    expect(hitsStroke({ ...square, tool: 'pen' }, 50, 50, 1)).toBe(false);
  });
});
