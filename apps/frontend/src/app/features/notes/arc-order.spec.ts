import type { ArcStep } from '@wortomat/shared';
import { buildTree } from '../../core/project-store';
import { testNode } from '../../testing/fake-api';
import { arcOrderIssues, sortedByStory, storyPositions } from './arc-order';

function step(id: string, ...sceneIds: Array<string | null>): ArcStep {
  return {
    id,
    noteId: 'mara',
    label: id,
    details: '',
    sceneIds: sceneIds.filter((s) => s !== null),
  };
}

/** Scene s1 … s5 at positions 1 … 5. */
const positions = new Map([1, 2, 3, 4, 5].map((n) => [`s${n}`, n]));

describe('storyPositions', () => {
  it('follows the book until scenes were arranged, simultaneous scenes share a position', () => {
    const tree = buildTree([
      testNode('k1', 'chapter', null, { sortOrder: 1 }),
      testNode('a', 'scene', 'k1', { sortOrder: 1 }),
      testNode('b', 'scene', 'k1', { sortOrder: 2 }),
      testNode('k2', 'chapter', null, { sortOrder: 2 }),
      testNode('c', 'scene', 'k2', { sortOrder: 1 }),
    ]);
    expect([...storyPositions(tree)]).toEqual([
      ['a', 0],
      ['b', 1],
      ['c', 2],
    ]);

    const arranged = buildTree([
      testNode('k1', 'chapter', null, { sortOrder: 1 }),
      testNode('a', 'scene', 'k1', { sortOrder: 1, storyOrder: 2 }),
      testNode('b', 'scene', 'k1', { sortOrder: 2, storyOrder: 1 }),
      testNode('c', 'scene', 'k1', { sortOrder: 3, storyOrder: 2 }),
    ]);
    expect(Object.fromEntries(storyPositions(arranged))).toEqual({ b: 0, a: 1, c: 1 });
  });
});

describe('arcOrderIssues', () => {
  it('finds nothing while the scenes follow the story', () => {
    const steps = [step('a', 's1'), step('b', null), step('c', 's3'), step('d', 's3')];
    expect(arcOrderIssues(steps, positions).size).toBe(0);
  });

  it('flags as few stations as possible and says where they belong', () => {
    // s5 is too early in the arc: it belongs after c (s3), at the end
    const early = [step('a', 's1'), step('x', 's5'), step('b', 's2'), step('c', 's3')];
    expect(Object.fromEntries(arcOrderIssues(early, positions))).toEqual({
      x: { afterId: 'c', beforeId: null },
    });

    // s1 is too late: it belongs before a (s2), at the start
    const late = [step('a', 's2'), step('b', 's3'), step('x', 's1'), step('c', 's4')];
    expect(Object.fromEntries(arcOrderIssues(late, positions))).toEqual({
      x: { afterId: null, beforeId: 'a' },
    });

    // s3 belongs between b (s2) and c (s4)
    const between = [step('a', 's1'), step('x', 's3'), step('b', 's2'), step('c', 's4')];
    expect(Object.fromEntries(arcOrderIssues(between, positions))).toEqual({
      x: { afterId: 'b', beforeId: 'c' },
    });
  });

  it('counts a station with several scenes from its earliest one', () => {
    // b shows in s2 and s5 – from s2 on, so it is in order between a and c
    const spread = [step('a', 's1'), step('b', 's5', 's2'), step('c', 's3')];
    expect(arcOrderIssues(spread, positions).size).toBe(0);
    // x starts with s4, after c
    const late = [step('a', 's1'), step('x', 's4', 's5'), step('b', 's2'), step('c', 's3')];
    expect(Object.fromEntries(arcOrderIssues(late, positions))).toEqual({
      x: { afterId: 'c', beforeId: null },
    });
  });

  it('ignores scenes that no longer exist', () => {
    expect(arcOrderIssues([step('a', 's3'), step('b', 'gone')], positions).size).toBe(0);
  });
});

describe('sortedByStory', () => {
  it('sorts the stations with scenes and keeps the others in place', () => {
    const steps = [step('a', 's3'), step('b', null), step('c', 's1'), step('d', 's2')];
    expect(sortedByStory(steps, positions)).toEqual(['c', 'b', 'd', 'a']);
  });

  it('sorts stations with several scenes by their earliest one', () => {
    const steps = [step('a', 's3'), step('b', 's5', 's1'), step('c', 's2')];
    expect(sortedByStory(steps, positions)).toEqual(['b', 'c', 'a']);
  });

  it('keeps the current order on simultaneous scenes', () => {
    const steps = [step('a', 's2'), step('b', 's2'), step('c', 's1')];
    expect(sortedByStory(steps, positions)).toEqual(['c', 'a', 'b']);
  });
});
