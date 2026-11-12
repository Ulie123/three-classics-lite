import type { Side } from '../../api/types';

/** Mirrors CheckersMove: the squares visited in order, and the squares of jumped pieces. */
export interface CheckersMove {
  path: number[];
  captures: number[];
}

/**
 * Mirrors CheckersState. The board is 64 characters, square = row * 8 + column, row 0 at the top as
 * Dark sees it: d/D dark man/king, l/L light man/king, '.' empty.
 */
export interface CheckersState {
  board: string;
  sideToMove: Side;
  quietPlies: number;
  positions: string[];
  lastMove: CheckersMove | null;
}

export type Piece = 'd' | 'D' | 'l' | 'L';
