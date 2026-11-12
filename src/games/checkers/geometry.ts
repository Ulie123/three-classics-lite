import type { Side } from '../../api/types';
import type { CheckersMove, CheckersState, Piece } from './types';

export const SIZE = 8;
export const CELL = 100;
export const FRAME = 20;
export const VIEW = SIZE * CELL + 2 * FRAME;
export const PIECE_R = CELL * 0.38;
export const HOP_MS = 300;

/** Playable squares have row + column odd, so a1 (bottom-left for Dark) is playable. */
export function isPlayable(square: number): boolean {
  return (Math.floor(square / SIZE) + (square % SIZE)) % 2 === 1;
}

/**
 * Screen position (top-left of the cell) of a board square. The board is drawn from the human's
 * side: when they play Light it is turned 180°, so their pieces are always at the bottom.
 */
export function squareOrigin(square: number, flipped: boolean): { x: number; y: number } {
  const row = Math.floor(square / SIZE);
  const column = square % SIZE;
  const screenRow = flipped ? SIZE - 1 - row : row;
  const screenColumn = flipped ? SIZE - 1 - column : column;
  return { x: FRAME + screenColumn * CELL, y: FRAME + screenRow * CELL };
}

export function squareCenter(square: number, flipped: boolean): { x: number; y: number } {
  const { x, y } = squareOrigin(square, flipped);
  return { x: x + CELL / 2, y: y + CELL / 2 };
}

/** The square shown at a screen row and column. */
export function squareAt(screenRow: number, screenColumn: number, flipped: boolean): number {
  const row = flipped ? SIZE - 1 - screenRow : screenRow;
  const column = flipped ? SIZE - 1 - screenColumn : screenColumn;
  return row * SIZE + column;
}

/** Algebraic name as Dark sees the board, matching the server's notation (a1 bottom-left). */
export function squareName(square: number): string {
  return `${String.fromCharCode(97 + (square % SIZE))}${SIZE - Math.floor(square / SIZE)}`;
}

export function owner(piece: string): Side | null {
  if (piece === 'd' || piece === 'D') return 'P1';
  if (piece === 'l' || piece === 'L') return 'P2';
  return null;
}

export function isKing(piece: string): boolean {
  return piece === 'D' || piece === 'L';
}

export function describePiece(piece: string): string {
  if (piece === '.') return 'empty';
  return `${owner(piece) === 'P1' ? 'dark' : 'light'} ${isKing(piece) ? 'king' : 'man'}`;
}

/** The board right after a move, drawn while the server confirms it. */
export function previewMove(state: CheckersState, move: CheckersMove): CheckersState {
  const board = state.board.split('');
  let piece = board[move.path[0]] as Piece;
  board[move.path[0]] = '.';
  for (const captured of move.captures) board[captured] = '.';
  const to = move.path[move.path.length - 1];
  const crowningRow = owner(piece) === 'P1' ? 0 : SIZE - 1;
  if (!isKing(piece) && Math.floor(to / SIZE) === crowningRow) piece = piece.toUpperCase() as Piece;
  board[to] = piece;
  return { ...state, board: board.join(''), sideToMove: state.sideToMove === 'P1' ? 'P2' : 'P1', lastMove: move };
}
