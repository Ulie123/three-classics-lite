import type { Side } from '../api/types';
import type { CheckersMove, CheckersState } from '../games/checkers/types';
import { type GameEngine, IllegalMoveError, draw, opponent, win } from './core';

/*
 * American checkers (English draughts), ported from Rules.java and CheckersEngine.java.
 * The board is 64 characters, square row * 8 + column, row 0 at the top as Dark sees it.
 */

export const SIZE = 8;
export const EMPTY = '.';
/** 40 moves by each side with no capture and no man moved. */
export const QUIET_PLY_LIMIT = 80;

const FORWARD_DARK = [
  [-1, -1],
  [-1, 1],
];
const FORWARD_LIGHT = [
  [1, -1],
  [1, 1],
];
const ALL = [
  [-1, -1],
  [-1, 1],
  [1, -1],
  [1, 1],
];

export function owner(piece: string): Side | null {
  if (piece === 'd' || piece === 'D') return 'P1';
  if (piece === 'l' || piece === 'L') return 'P2';
  return null;
}

export const isKing = (piece: string) => piece === 'D' || piece === 'L';

const isPlayable = (row: number, column: number) =>
  row >= 0 && row < SIZE && column >= 0 && column < SIZE && (row + column) % 2 === 1;

export const crowningRow = (side: Side) => (side === 'P1' ? 0 : SIZE - 1);

function directions(piece: string): number[][] {
  if (isKing(piece)) return ALL;
  return owner(piece) === 'P1' ? FORWARD_DARK : FORWARD_LIGHT;
}

/** All legal moves for `side`: only captures if any capture exists. */
export function moves(board: string[], side: Side): CheckersMove[] {
  const captures: CheckersMove[] = [];
  for (let square = 0; square < SIZE * SIZE; square++) {
    if (owner(board[square]) === side) collectJumps(board, square, captures);
  }
  if (captures.length > 0) return captures;

  const simple: CheckersMove[] = [];
  for (let square = 0; square < SIZE * SIZE; square++) {
    const piece = board[square];
    if (owner(piece) !== side) continue;
    const row = Math.floor(square / SIZE);
    const column = square % SIZE;
    for (const [dr, dc] of directions(piece)) {
      const r = row + dr;
      const c = column + dc;
      if (isPlayable(r, c) && board[r * SIZE + c] === EMPTY) {
        simple.push({ path: [square, r * SIZE + c], captures: [] });
      }
    }
  }
  return simple;
}

function collectJumps(board: string[], from: number, out: CheckersMove[]) {
  const piece = board[from];
  // The jumping piece has left its square, so a king may pass back over it.
  board[from] = EMPTY;
  try {
    extend(board, piece, [from], [], out);
  } finally {
    board[from] = piece;
  }
}

function extend(board: string[], piece: string, path: number[], captured: number[], out: CheckersMove[]) {
  const at = path[path.length - 1];
  const row = Math.floor(at / SIZE);
  const column = at % SIZE;
  let jumped = false;
  for (const [dr, dc] of directions(piece)) {
    const landRow = row + 2 * dr;
    const landColumn = column + 2 * dc;
    if (!isPlayable(landRow, landColumn)) continue;
    const mid = (row + dr) * SIZE + column + dc;
    const land = landRow * SIZE + landColumn;
    const enemy = owner(board[mid]);
    if (enemy === null || enemy === owner(piece) || captured.includes(mid) || board[land] !== EMPTY) continue;

    jumped = true;
    path.push(land);
    captured.push(mid);
    if (!isKing(piece) && landRow === crowningRow(owner(piece)!)) {
      // Crowned mid-jump: the move ends here.
      out.push({ path: [...path], captures: [...captured] });
    } else {
      extend(board, piece, path, captured, out);
    }
    path.pop();
    captured.pop();
  }
  if (!jumped && path.length > 1) out.push({ path: [...path], captures: [...captured] });
}

/** Plays a move that is known to be legal and returns the new board. */
export function play(board: string[], move: CheckersMove): string[] {
  const next = [...board];
  const from = move.path[0];
  const to = move.path[move.path.length - 1];
  let piece = next[from];
  next[from] = EMPTY;
  for (const square of move.captures) next[square] = EMPTY;
  if (!isKing(piece) && Math.floor(to / SIZE) === crowningRow(owner(piece)!)) piece = piece.toUpperCase();
  next[to] = piece;
  return next;
}

/** A capture or a man moving can never be undone, so it resets the draw counters. */
const isIrreversible = (board: string[], move: CheckersMove) => move.captures.length > 0 || !isKing(board[move.path[0]]);

const count = (board: string[], side: Side) => board.filter((piece) => owner(piece) === side).length;

const key = (board: string, sideToMove: Side) => board + (sideToMove === 'P1' ? 'd' : 'l');

const sameMove = (a: CheckersMove, b: CheckersMove) =>
  a.path.length === b.path.length &&
  a.path.every((square, i) => square === b.path[i]) &&
  a.captures.length === (b.captures ?? []).length &&
  a.captures.every((square, i) => square === b.captures[i]);

export function squareName(square: number): string {
  return String.fromCharCode(97 + (square % SIZE)) + (SIZE - Math.floor(square / SIZE));
}

export const checkersEngine: GameEngine<CheckersState, CheckersMove> = {
  initialState() {
    let board = '';
    for (let row = 0; row < SIZE; row++) {
      for (let column = 0; column < SIZE; column++) {
        board += !isPlayable(row, column) ? EMPTY : row < 3 ? 'l' : row > 4 ? 'd' : EMPTY;
      }
    }
    return { board, sideToMove: 'P1', quietPlies: 0, positions: [key(board, 'P1')], lastMove: null };
  },

  normalize(state) {
    if (typeof state.board !== 'string' || state.board.length !== SIZE * SIZE) {
      throw new Error('A checkers board has 64 squares');
    }
    return {
      board: state.board,
      sideToMove: state.sideToMove,
      quietPlies: state.quietPlies ?? 0,
      positions: state.positions ?? [key(state.board, state.sideToMove)],
      lastMove: state.lastMove ?? null,
    };
  },

  sideToMove: (state) => state.sideToMove,

  legalMoves(state) {
    return this.outcome(state) ? [] : moves([...state.board], state.sideToMove);
  },

  apply(state, move) {
    if (this.outcome(state)) throw new IllegalMoveError('The game is already over.');
    const board = [...state.board];
    const legal = moves(board, state.sideToMove);
    const valid = move && Array.isArray(move.path) && legal.some((candidate) => sameMove(candidate, move));
    if (!valid) {
      const captureRequired = legal.some((candidate) => candidate.captures.length > 0);
      const isCapture = Boolean(move?.captures?.length);
      throw new IllegalMoveError(
        captureRequired && !isCapture ? 'A capture is available, so you must capture.' : "That move isn't legal here.",
      );
    }

    const played: CheckersMove = { path: [...move.path], captures: [...(move.captures ?? [])] };
    const irreversible = isIrreversible(board, played);
    const next = play(board, played).join('');
    const toMove = opponent(state.sideToMove);
    const positions = [...(irreversible ? [] : state.positions), key(next, toMove)];
    const quietPlies = irreversible ? 0 : state.quietPlies + 1;
    return { board: next, sideToMove: toMove, quietPlies, positions, lastMove: played };
  },

  outcome(state) {
    const board = [...state.board];
    const toMove = state.sideToMove;
    if (count(board, toMove) === 0) return win(opponent(toMove), 'No pieces left');
    if (moves(board, toMove).length === 0) return win(opponent(toMove), 'No legal moves left');
    if (state.quietPlies >= QUIET_PLY_LIMIT) return draw('Draw by 40-move rule');
    const current = state.positions[state.positions.length - 1];
    if (state.positions.filter((position) => position === current).length >= 3) {
      return draw('Draw by threefold repetition');
    }
    return null;
  },

  clientMoves(state) {
    return this.legalMoves(state);
  },
  moveGraph: () => null,

  /** Algebraic squares as Dark sees the board, e.g. "c3–d4" or "c3×e5×g7". */
  notation(move) {
    return move.path.map(squareName).join(move.captures.length > 0 ? '×' : '–');
  },

  recorded: (_before, move) => move,
};
