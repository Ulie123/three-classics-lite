import { describe, expect, it } from 'vitest';
import { isComplete, movableFrom, remainingDice, stepBetween, stepsFrom } from './turn';
import type { TurnGraph } from './types';

// A 3-1 from a checker on 8 and one on 6. Playing 8/5 then 6/5 and 6/5 then 8/5 reach the same
// position, so they share node 3; 8/7 7/4 is a separate path.
const graph: TurnGraph = {
  nodes: [
    { steps: [[8, 5, 3, 0, 1], [6, 5, 1, 0, 2], [8, 7, 1, 0, 4]], complete: false },
    { steps: [[6, 5, 1, 0, 3]], complete: false },
    { steps: [[8, 5, 3, 0, 3]], complete: false },
    { steps: [], complete: true },
    { steps: [[7, 4, 3, 0, 5]], complete: false },
    { steps: [], complete: true },
  ],
};

describe('turn graph walker (legal-prefix matching for backgammon)', () => {
  it('offers only the first steps of legal turns at the start', () => {
    expect(movableFrom(graph, [0])).toEqual([8, 6]);
    expect(stepsFrom(graph, [0]).map((s) => `${s.from}/${s.to}`)).toEqual(['8/5', '6/5', '8/7']);
  });

  it('accepts either order of play and reaches the same completed turn', () => {
    expect(stepsFrom(graph, [0, 1]).map((s) => `${s.from}/${s.to}`)).toEqual(['6/5']);
    expect(stepsFrom(graph, [0, 2]).map((s) => `${s.from}/${s.to}`)).toEqual(['8/5']);
    expect(isComplete(graph, [0, 1, 3])).toBe(true);
    expect(isComplete(graph, [0, 2, 3])).toBe(true);
  });

  it('does not treat a partial turn as complete', () => {
    expect(isComplete(graph, [0])).toBe(false);
    expect(isComplete(graph, [0, 4])).toBe(false);
  });

  it('finds the step between two locations, preferring the smaller die', () => {
    const bearOff: TurnGraph = {
      nodes: [{ steps: [[3, 0, 6, 0, 1], [3, 0, 5, 0, 2]], complete: false }, { steps: [], complete: true }, { steps: [], complete: true }],
    };
    expect(stepBetween(bearOff, [0], 3, 0)?.die).toBe(5);
    expect(stepBetween(graph, [0], 8, 4)).toBeNull();
  });

  it('dims each die as it is used, four for doubles', () => {
    expect(remainingDice([3, 1], [{ from: 8, to: 5, die: 3, hit: false }])).toEqual([false, true]);
    expect(remainingDice([2, 2], [{ from: 6, to: 4, die: 2, hit: false }])).toEqual([false, true, true, true]);
  });
});
