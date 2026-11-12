import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import type { BackgammonMove, BackgammonState } from '../games/backgammon/types';
import type { CheckersMove, CheckersState } from '../games/checkers/types';
import type { ConnectFourMove, ConnectFourState } from '../games/connect-four/types';
import { backgammonEngine, pipCount } from './backgammon';
import { Position, resultOf } from './backgammonPosition';
import { evaluateBackgammon, evaluate as evaluateBackgammonPosition } from './backgammonAi';
import { checkersEngine } from './checkers';
import { evaluate as evaluateCheckers } from './checkersAi';
import { connectFourEngine } from './connectFour';
import { evaluateConnectFour } from './connectFourAi';
import type { Rng } from './core';

/*
 * The TypeScript engines must behave exactly like the Java engines of the full project. The golden
 * file was written by tools/golden (run against the Java build): seeded random games with every
 * legal-move list, outcome, notation, evaluation score, dice roll and resulting state. Here each
 * game is replayed move by move and every one of those must match.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;
const golden: Record<string, Json[]> = JSON.parse(
  gunzipSync(readFileSync(new URL('./golden/java-games.json.gz', import.meta.url))).toString('utf8'),
);

/** FNV-1a over compact JSON, the same digest the Java harness wrote for long lists. */
function digest(value: unknown): string {
  const text = JSON.stringify(value);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}

/** Replays the exact nextInt results the Java engine consumed. */
function scripted(values: number[]): Rng & { left: () => number } {
  let i = 0;
  return {
    int(bound) {
      if (i >= values.length) throw new Error('Ran out of scripted dice');
      const value = values[i++];
      expect(value).toBeLessThan(bound);
      return value;
    },
    bool: () => {
      throw new Error('Engines never flip coins');
    },
    left: () => values.length - i,
  };
}

const unused: Rng = scripted([]);

describe('Connect Four matches the Java engine', () => {
  it.each(golden.connectFour.map((game, i) => [i, game]))('game %i', (_i, game: Json) => {
    let state = connectFourEngine.normalize(game.initial as ConnectFourState);
    expect(state).toEqual(connectFourEngine.initialState());
    for (const ply of game.plies) {
      expect(connectFourEngine.sideToMove(state)).toBe(ply.sideToMove);
      expect(connectFourEngine.legalMoves(state)).toEqual(ply.legal);
      expect(connectFourEngine.outcome(state)).toEqual(ply.outcome);
      if (!ply.move) break;
      expect(evaluateConnectFour(state)).toBe(ply.eval);
      const move = ply.move as ConnectFourMove;
      expect(connectFourEngine.notation(move)).toBe(ply.notation);
      state = connectFourEngine.apply(state, move, unused);
      expect(state).toEqual(ply.after);
    }
  });
});

describe('Checkers matches the Java engine', () => {
  it.each(golden.checkers.map((game, i) => [i, game]))('game %i', (_i, game: Json) => {
    let state = checkersEngine.normalize(game.initial as CheckersState);
    expect(state).toEqual(checkersEngine.initialState());
    for (const ply of game.plies) {
      expect(checkersEngine.sideToMove(state)).toBe(ply.sideToMove);
      expect(checkersEngine.legalMoves(state)).toEqual(ply.legal);
      expect(checkersEngine.outcome(state)).toEqual(ply.outcome);
      if (!ply.move) break;
      const board = [...state.board];
      expect(evaluateCheckers(board, state.sideToMove, false)).toBe(ply.eval);
      expect(evaluateCheckers(board, state.sideToMove, true)).toBe(ply.evalRich);
      const move = ply.move as CheckersMove;
      expect(checkersEngine.notation(move)).toBe(ply.notation);
      state = checkersEngine.apply(state, move, unused);
      expect({
        board: state.board,
        sideToMove: state.sideToMove,
        quietPlies: state.quietPlies,
        positions: state.positions.length,
        lastPosition: state.positions[state.positions.length - 1],
        lastMove: state.lastMove,
      }).toEqual(ply.after);
    }
    expect(state).toEqual(game.final);
  });
});

describe('Backgammon matches the Java engine', () => {
  it.each(golden.backgammon.map((game, i) => [i, game]))('game %i', (_i, game: Json) => {
    let state = backgammonEngine.normalize(game.initial as BackgammonState);
    expect(state).toEqual(backgammonEngine.initialState());
    for (const ply of game.plies) {
      expect(backgammonEngine.sideToMove(state)).toBe(ply.sideToMove);
      expect(backgammonEngine.outcome(state)).toEqual(ply.outcome);
      expect([pipCount(state, 'P1'), pipCount(state, 'P2')]).toEqual(ply.pips);

      const legal = backgammonEngine.legalMoves(state);
      expect(legal.length).toBe(ply.legalCount);
      expect(digest(legal)).toBe(ply.legalDigest);
      const client = backgammonEngine.clientMoves(state);
      expect(client.length).toBe(ply.clientCount);
      if (ply.client) expect(client).toEqual(ply.client);
      expect(digest(client)).toBe(ply.clientDigest);
      const graph = backgammonEngine.moveGraph(state);
      if (ply.graph) expect(graph).toEqual(ply.graph);
      expect(digest(graph)).toBe(ply.graphDigest);
      if (!ply.move) break;

      if (state.phase === 'MOVE') {
        expect(evaluateBackgammon(state)).toBe(ply.eval);
        const position = Position.of(state, state.sideToMove);
        const evals = client.map((move) => evaluateBackgammonPosition(resultOf(position, move.steps)));
        expect(evals).toEqual(ply.clientEvals);
      }

      const dice = scripted(ply.rolls);
      const next = backgammonEngine.apply(state, ply.move as BackgammonMove, dice);
      expect(dice.left()).toBe(0);
      const recorded = backgammonEngine.recorded(state, ply.move as BackgammonMove, next);
      expect(recorded).toEqual(ply.recorded);
      expect(backgammonEngine.notation(recorded)).toBe(ply.notation);
      expect(next).toEqual(ply.after);
      state = next;
    }
  });
});
