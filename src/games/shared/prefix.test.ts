import { describe, expect, it } from 'vitest';
import { completedBy, matching, nextSteps } from './prefix';

describe('legal-prefix matcher', () => {
  // Two checkers moves from square 42: a simple step, and a double jump through 28.
  const paths = [
    [42, 33],
    [42, 28, 14],
    [46, 37],
  ];

  it('offers the first step of every sequence when nothing is chosen', () => {
    expect(nextSteps(paths, [])).toEqual([42, 46]);
  });

  it('offers only steps that continue a legal prefix', () => {
    expect(nextSteps(paths, [42])).toEqual([33, 28]);
    expect(nextSteps(paths, [42, 28])).toEqual([14]);
    expect(nextSteps(paths, [46])).toEqual([37]);
  });

  it('offers nothing after an illegal step', () => {
    expect(nextSteps(paths, [42, 35])).toEqual([]);
    expect(matching(paths, [42, 35])).toEqual([]);
  });

  it('recognises a completed sequence but not a partial one', () => {
    expect(completedBy(paths, [42, 28])).toBe(-1);
    expect(completedBy(paths, [42, 28, 14])).toBe(1);
    expect(completedBy(paths, [42, 33])).toBe(0);
  });

  it('deduplicates steps shared by several sequences', () => {
    const turns = [
      [{ from: 24, to: 18 }, { from: 18, to: 13 }],
      [{ from: 24, to: 18 }, { from: 13, to: 8 }],
      [{ from: 13, to: 8 }, { from: 24, to: 18 }],
    ];
    const equals = (a: { from: number; to: number }, b: { from: number; to: number }) => a.from === b.from && a.to === b.to;
    expect(nextSteps(turns, [], equals)).toEqual([
      { from: 24, to: 18 },
      { from: 13, to: 8 },
    ]);
    expect(nextSteps(turns, [{ from: 24, to: 18 }], equals)).toHaveLength(2);
    expect(completedBy(turns, [{ from: 13, to: 8 }, { from: 24, to: 18 }], equals)).toBe(2);
  });
});
