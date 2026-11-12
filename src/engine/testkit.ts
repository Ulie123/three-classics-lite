import type { Side } from '../api/types';
import type { BackgammonState, Step } from '../games/backgammon/types';
import type { CheckersMove, CheckersState } from '../games/checkers/types';
import type { ConnectFourState } from '../games/connect-four/types';
import type { Rng } from './core';

/* Position builders for tests, the same shapes as the Java test helpers. */

/** A Connect Four board from a picture: top row first, X = P1 (coral), O = P2 (gold), . = empty. */
export function connectFour(picture: string, toMove: Side): ConnectFourState {
  const lines = picture
    .trim()
    .split('\n')
    .map((line) => line.trim());
  const columns: Side[][] = [];
  for (let column = 0; column < 7; column++) {
    const discs: Side[] = [];
    for (let row = 0; row < 6; row++) {
      const c = lines[5 - row][column];
      if (c !== '.') discs.push(c === 'X' ? 'P1' : 'P2');
    }
    columns.push(discs);
  }
  return { columns, sideToMove: toMove, winningLines: [], lastDrop: null };
}

/** A checkers square from its algebraic name as Dark sees the board (a1 bottom-left). */
export function sq(name: string): number {
  const column = name.charCodeAt(0) - 97;
  const row = 8 - Number(name[1]);
  if ((row + column) % 2 === 0) throw new Error(`${name} is a light square`);
  return row * 8 + column;
}

export function checkers(pieces: Record<string, string>, toMove: Side, quietPlies = 0): CheckersState {
  const board = Array<string>(64).fill('.');
  for (const [piece, squares] of Object.entries(pieces)) {
    for (const name of squares.split(' ')) board[sq(name)] = piece;
  }
  const text = board.join('');
  return { board: text, sideToMove: toMove, quietPlies, positions: [text + (toMove === 'P1' ? 'd' : 'l')], lastMove: null };
}

export const move = (...squares: string[]): CheckersMove => ({ path: squares.map(sq), captures: [] });
export const jump = (path: string[], captures: string[]): CheckersMove => ({ path: path.map(sq), captures: captures.map(sq) });

/**
 * A backgammon position with each side counted in its own numbering (25 is the bar). Checkers not
 * placed are borne off, so each side always totals 15.
 */
export function backgammon(
  ivory: Record<number, number>,
  obsidian: Record<number, number>,
  side: Side,
  dice: number[] = [],
): BackgammonState {
  const count = (side: Record<number, number>, p: number) => side[p] ?? 0;
  const points = Array.from({ length: 24 }, (_, i) => count(ivory, i + 1) - count(obsidian, 24 - i));
  const total = (side: Record<number, number>) => Object.values(side).reduce((a, b) => a + b, 0);
  return {
    points: points.map((value) => value || 0),
    barP1: count(ivory, 25),
    barP2: count(obsidian, 25),
    offP1: 15 - total(ivory),
    offP2: 15 - total(obsidian),
    sideToMove: side,
    phase: dice.length ? 'MOVE' : 'ROLL',
    dice,
    opening: null,
    notices: [],
    lastTurn: null,
  };
}

export const step = (from: number, to: number, die: number, hit = false): Step => ({ from, to, die, hit });

/** A "random" source that rolls the given dice faces in order. */
export function dice(...faces: number[]): Rng {
  return {
    int: () => {
      const face = faces.shift();
      if (face === undefined) throw new Error('No more scripted dice');
      return face - 1;
    },
    bool: () => false,
  };
}
