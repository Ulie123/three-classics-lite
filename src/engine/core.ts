import type { Difficulty, Outcome, Side } from '../api/types';

/**
 * The rules of one game, ported from the Java engines of the full project. Engines are pure:
 * states are plain JSON objects that are never mutated, and `apply` returns a new state.
 */
export interface GameEngine<S, M> {
  initialState(): S;
  /** Fills in optional fields of a state loaded from JSON, as the Java record constructors do. */
  normalize(state: S): S;
  sideToMove(state: S): Side;
  /** Every legal move for the side to move. Empty once the game is over. */
  legalMoves(state: S): M[];
  /** Applies a move after checking it is legal; throws IllegalMoveError otherwise. */
  apply(state: S, move: M, rng: Rng): S;
  outcome(state: S): Outcome | null;
  /** The legal moves as offered to the client (backgammon collapses equivalent orders). */
  clientMoves(state: S): M[];
  /** A step-by-step structure the client walks to build a multi-step move, or null. */
  moveGraph(state: S): unknown;
  notation(move: M): string;
  /** The move as stored in history, e.g. a roll records its dice. */
  recorded(before: S, move: M, after: S): M;
}

/** A computer player. It only returns legal moves, and all its randomness comes from `rng`. */
export interface AiPlayer<S, M> {
  chooseMove(state: S, difficulty: Difficulty, rng: Rng, budgetMs: number): M;
}

/** A source of randomness: `int(bound)` returns 0 ≤ n < bound. */
export interface Rng {
  int(bound: number): number;
  bool(): boolean;
}

export class IllegalMoveError extends Error {}

export function opponent(side: Side): Side {
  return side === 'P1' ? 'P2' : 'P1';
}

export function win(winner: Side, reason: string, points = 1): Outcome {
  return { winner, reason, points, draw: false };
}

export function draw(reason: string): Outcome {
  return { winner: null, reason, points: 0, draw: true };
}

/** Dice and computer choices in the app, from the browser's cryptographic generator. */
export const secureRng: Rng = {
  int(bound) {
    const limit = Math.floor(0x1_0000_0000 / bound) * bound;
    const buffer = new Uint32Array(1);
    for (;;) {
      crypto.getRandomValues(buffer);
      if (buffer[0] < limit) return buffer[0] % bound;
    }
  },
  bool() {
    return this.int(2) === 1;
  },
};

/** A small seeded generator (mulberry32) for tests and reproducible soak games. */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 0x1_0000_0000;
  };
  return {
    int: (bound) => Math.floor(next() * bound),
    bool: () => next() < 0.5,
  };
}

/** Deep equality for the plain JSON moves the engines use (the Java records' equals). */
export function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
