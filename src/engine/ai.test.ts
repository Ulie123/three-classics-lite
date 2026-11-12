import { describe, expect, it } from 'vitest';
import type { Difficulty } from '../api/types';
import { ROLL, backgammonEngine } from './backgammon';
import { backgammonAi } from './backgammonAi';
import { checkersEngine } from './checkers';
import { checkersAi } from './checkersAi';
import { connectFourEngine } from './connectFour';
import { connectFourAi } from './connectFourAi';
import { type AiPlayer, type GameEngine, now, seededRng } from './core';
import { backgammon, checkers, connectFour, dice, move } from './testkit';

/* The computer players, ported from the Java AI tests, plus soak games for every game type. */

const BUDGET = 1000;
const hardColumn = (picture: string, side: 'P1' | 'P2') =>
  connectFourAi.chooseMove(connectFour(picture, side), 'HARD', seededRng(7), BUDGET).column;

describe('Connect Four computer', () => {
  it('opens in the centre on Hard', () => {
    expect(connectFourAi.chooseMove(connectFourEngine.initialState(), 'HARD', seededRng(7), BUDGET).column).toBe(3);
  });

  it('takes an immediate win even when threatened', () => {
    expect(hardColumn('.......\n.......\n.......\nO......\nO......\nOXXX...', 'P1')).toBe(4);
    expect(hardColumn('.......\n.......\n.......\nO.....X\nO.....X\nO..X..X', 'P2')).toBe(0);
  });

  it('blocks a single threat', () => {
    expect(hardColumn('.......\n.......\n.......\n.......\n...O...\n.XXXO..', 'P2')).toBe(0);
    expect(hardColumn('.......\n.......\n.....X.\n.....X.\n.....X.\n..O..O.', 'P2')).toBe(5);
  });

  it('answers within the two-second cap', () => {
    const midgame = connectFour('.......\n.......\n...X...\n..OO...\n..XXO..\n.OXOX..', 'P1');
    const start = now();
    const { column } = connectFourAi.chooseMove(midgame, 'HARD', seededRng(1), BUDGET);
    expect(now() - start).toBeLessThan(2000);
    expect(connectFourEngine.legalMoves(midgame)).toContainEqual({ column });
  });

  it('varies its openings on Easy and Medium', () => {
    const start = connectFourEngine.initialState();
    const rng = seededRng(3);
    const medium = new Set<number>();
    const easy = new Set<number>();
    for (let i = 0; i < 40; i++) {
      medium.add(connectFourAi.chooseMove(start, 'MEDIUM', rng, BUDGET).column);
      easy.add(connectFourAi.chooseMove(start, 'EASY', rng, BUDGET).column);
    }
    expect(medium.size).toBeGreaterThan(1);
    expect(easy.size).toBeGreaterThan(2);
  });
});

describe('Checkers computer', () => {
  it('answers within the two-second cap', () => {
    for (const state of [
      checkersEngine.initialState(),
      checkers({ d: 'a1 c1 e1 b2 d2 c3 e3 f4', D: 'd6', l: 'b8 d8 h8 a7 c7 e7 b6 f6 h6', L: 'g3' }, 'P2'),
    ]) {
      const start = now();
      const chosen = checkersAi.chooseMove(state, 'HARD', seededRng(5), BUDGET);
      expect(now() - start).toBeLessThan(2000);
      expect(checkersEngine.legalMoves(state)).toContainEqual(chosen);
    }
  });

  it('avoids hanging a piece on Hard', () => {
    const state = checkers({ d: 'c3 a1', l: 'e5 h8' }, 'P1');
    expect(checkersAi.chooseMove(state, 'HARD', seededRng(1), BUDGET)).not.toEqual(move('c3', 'd4'));
  });
});

describe('Backgammon computer', () => {
  const opening = (a: number, b: number) =>
    backgammon({ 24: 2, 13: 5, 8: 3, 6: 5 }, { 24: 2, 13: 5, 8: 3, 6: 5 }, 'P1', [a, b]);

  it('rolls when it is time to roll', () => {
    expect(backgammonAi.chooseMove(backgammonEngine.initialState(), 'HARD', seededRng(1), BUDGET)).toEqual(ROLL);
  });

  it('answers within the two-second cap on every opening roll', () => {
    for (let a = 1; a <= 6; a++) {
      for (let b = 1; b <= 6; b++) {
        const state = opening(a, b);
        const start = now();
        const chosen = backgammonAi.chooseMove(state, 'HARD', seededRng(1), BUDGET);
        expect(now() - start, `roll ${a}-${b}`).toBeLessThan(2000);
        expect(() => backgammonEngine.apply(state, chosen, dice())).not.toThrow();
      }
    }
  }, 120_000);

  it('hits an exposed blot in its home board on Hard', () => {
    const state = backgammon({ 8: 3, 6: 5, 13: 5, 24: 2 }, { 20: 1, 13: 5, 8: 3, 6: 5, 24: 1 }, 'P1', [3, 1]);
    const chosen = backgammonAi.chooseMove(state, 'HARD', seededRng(1), BUDGET);
    expect(chosen.steps.some((s) => s.hit)).toBe(true);
  });

  it('picks the same Hard openings as the Java computer', () => {
    // Expected moves from BackgammonAi.java on the same positions (tools/golden, HardCheck).
    const java: Record<string, string> = {
      '6,5': '6–5: 13/7 7/2',
      '3,1': '3–1: 8/5 6/5',
      '6,1': '6–1: 13/7 8/7',
      '4,2': '4–2: 8/4 6/4',
      '5,3': '5–3: 8/3 6/3',
      '6,4': '6–4: 8/2 6/2',
      '2,1': '2–1: 13/11 11/10',
    };
    for (const [roll, expected] of Object.entries(java)) {
      const [a, b] = roll.split(',').map(Number);
      const chosen = backgammonAi.chooseMove(opening(a, b), 'HARD', seededRng(1), 5000);
      expect(backgammonEngine.notation(chosen)).toBe(expected);
    }
  });

  it('makes the 5-point with a 3-1 on Medium', () => {
    const state = opening(3, 1);
    const after = backgammonEngine.apply(state, backgammonAi.chooseMove(state, 'MEDIUM', seededRng(1), BUDGET), dice());
    expect(after.points[4]).toBe(2);
  });
});

/** Seeded computer-vs-computer games that must end, with invariants checked after every move. */
function soak<S, M>(
  engine: GameEngine<S, M>,
  ai: AiPlayer<S, M>,
  games: number,
  difficulty: Difficulty,
  invariant: (before: S, after: S) => void = () => {},
) {
  const rng = seededRng(42);
  for (let game = 0; game < games; game++) {
    let state = engine.initialState();
    let plies = 0;
    while (!engine.outcome(state)) {
      const chosen = ai.chooseMove(state, difficulty, rng, 50);
      const next = engine.apply(state, chosen, rng); // throws if the move is illegal
      invariant(state, next);
      state = next;
      expect(++plies, `game ${game} never ended`).toBeLessThan(2000);
    }
    expect(engine.legalMoves(state)).toEqual([]);
  }
}

describe('Soak games run to completion', () => {
  it('Connect Four', () => soak(connectFourEngine, connectFourAi, 300, 'EASY'));

  it('Checkers, with piece counts that never increase', () => {
    const count = (board: string, pieces: string) => [...board].filter((c) => pieces.includes(c)).length;
    soak(checkersEngine, checkersAi, 200, 'EASY', (before, after) => {
      expect(count(after.board, 'dD')).toBeLessThanOrEqual(count(before.board, 'dD'));
      expect(count(after.board, 'lL')).toBeLessThanOrEqual(count(before.board, 'lL'));
    });
  });

  it('Backgammon, with fifteen checkers each', () => {
    soak(backgammonEngine, backgammonAi, 100, 'EASY', (_before, after) => {
      let ivory = after.barP1 + after.offP1;
      let obsidian = after.barP2 + after.offP2;
      for (const count of after.points) {
        if (count > 0) ivory += count;
        else obsidian -= count;
      }
      expect(ivory).toBe(15);
      expect(obsidian).toBe(15);
    });
  }, 120_000);

  it('Medium games against Medium end too', () => {
    soak(connectFourEngine, connectFourAi, 10, 'MEDIUM');
    soak(checkersEngine, checkersAi, 5, 'MEDIUM');
    soak(backgammonEngine, backgammonAi, 5, 'MEDIUM');
  }, 120_000);
});
