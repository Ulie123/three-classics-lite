import type { Side } from '../../api/types';

/** One checker moving one die's worth, in the mover's own numbering: 25 is the bar, 0 is off. */
export interface Step {
  from: number;
  to: number;
  die: number;
  hit: boolean;
}

export interface BackgammonMove {
  kind: 'ROLL' | 'OPENING' | 'TURN';
  steps: Step[];
  dice: number[] | null;
}

export interface Notice {
  kind: 'NO_MOVES' | 'CLOSED_OUT';
  side: Side;
}

/**
 * Mirrors BackgammonState. `points[i]` is P1's point i + 1: positive counts are P1 (ivory),
 * negative counts P2 (obsidian).
 */
export interface BackgammonState {
  points: number[];
  barP1: number;
  barP2: number;
  offP1: number;
  offP2: number;
  sideToMove: Side;
  phase: 'OPENING' | 'ROLL' | 'MOVE';
  dice: number[];
  opening: number[] | null;
  notices: Notice[];
  lastTurn: BackgammonMove | null;
}

/** Mirrors TurnGraph: each node's steps are [from, to, die, hit (0/1), child]. Node 0 starts the turn. */
export interface TurnGraph {
  nodes: { steps: [number, number, number, number, number][]; complete: boolean }[];
}

export const BAR = 25;
export const OFF = 0;
export const CHECKERS = 15;
