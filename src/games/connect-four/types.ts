import type { Side } from '../../api/types';

export interface Cell {
  column: number;
  row: number;
}

export interface WinLine {
  direction: 'HORIZONTAL' | 'VERTICAL' | 'DIAGONAL_UP' | 'DIAGONAL_DOWN';
  cells: Cell[];
}

/** Mirrors ConnectFourState: each column lists its discs from the bottom up. */
export interface ConnectFourState {
  columns: Side[][];
  sideToMove: Side;
  winningLines: WinLine[];
  lastDrop: Cell | null;
}

export interface ConnectFourMove {
  column: number;
}
