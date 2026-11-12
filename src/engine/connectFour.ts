import type { Side } from '../api/types';
import type { Cell, ConnectFourMove, ConnectFourState, WinLine } from '../games/connect-four/types';
import { type GameEngine, IllegalMoveError, draw, opponent, win } from './core';

export const COLUMNS = 7;
export const ROWS = 6;
const COUNT_WORDS = ['', '', '', '', 'Four', 'Five', 'Six', 'Seven'];

/**
 * Connect Four on a 7×6 grid. Four or more in a row (any direction) wins immediately; a full board
 * without one is a draw. Port of ConnectFourEngine.java.
 */
export const connectFourEngine: GameEngine<ConnectFourState, ConnectFourMove> = {
  initialState() {
    return { columns: Array.from({ length: COLUMNS }, () => []), sideToMove: 'P1', winningLines: [], lastDrop: null };
  },

  normalize(state) {
    if (!Array.isArray(state.columns) || state.columns.length !== COLUMNS) {
      throw new Error(`Connect Four has ${COLUMNS} columns`);
    }
    if (state.columns.some((column) => column.length > ROWS)) {
      throw new Error(`A column holds at most ${ROWS} discs`);
    }
    return {
      columns: state.columns.map((column) => [...column]),
      sideToMove: state.sideToMove,
      winningLines: state.winningLines ?? [],
      lastDrop: state.lastDrop ?? null,
    };
  },

  sideToMove: (state) => state.sideToMove,

  legalMoves(state) {
    if (isOver(state)) return [];
    const moves: ConnectFourMove[] = [];
    for (let column = 0; column < COLUMNS; column++) {
      if (state.columns[column].length < ROWS) moves.push({ column });
    }
    return moves;
  },

  apply(state, move) {
    if (isOver(state)) throw new IllegalMoveError('The game is already over.');
    const column = move?.column;
    if (!Number.isInteger(column) || column < 0 || column >= COLUMNS) {
      throw new IllegalMoveError(`There is no column ${column}.`);
    }
    if (state.columns[column].length === ROWS) throw new IllegalMoveError(`Column ${column + 1} is full.`);

    const mover = state.sideToMove;
    const columns = state.columns.map((discs, c) => (c === column ? [...discs, mover] : discs));
    const landed: Cell = { column, row: columns[column].length - 1 };
    return { columns, sideToMove: opponent(mover), winningLines: linesThrough(columns, landed, mover), lastDrop: landed };
  },

  outcome(state) {
    if (state.winningLines.length > 0) {
      const first = state.winningLines[0].cells[0];
      return win(state.columns[first.column][first.row], describe(state.winningLines));
    }
    if (isFull(state)) return draw('The board is full');
    return null;
  },

  clientMoves(state) {
    return this.legalMoves(state);
  },
  moveGraph: () => null,
  notation: (move) => `Column ${move.column + 1}`,
  recorded: (_before, move) => move,
};

function isFull(state: ConnectFourState) {
  return state.columns.every((column) => column.length === ROWS);
}

function isOver(state: ConnectFourState) {
  return state.winningLines.length > 0 || isFull(state);
}

const STEPS: [number, number, WinLine['direction']][] = [
  [1, 0, 'HORIZONTAL'],
  [0, 1, 'VERTICAL'],
  [1, 1, 'DIAGONAL_UP'],
  [1, -1, 'DIAGONAL_DOWN'],
];

/** Every line of four or more through the new disc. One drop can complete several lines. */
function linesThrough(columns: Side[][], from: Cell, side: Side): WinLine[] {
  const owns = (c: number, r: number) => c >= 0 && c < COLUMNS && r >= 0 && r < ROWS && columns[c][r] === side;
  const lines: WinLine[] = [];
  for (const [dc, dr, direction] of STEPS) {
    // Walk back to the start of the run, then forward to its end.
    let c = from.column;
    let r = from.row;
    while (owns(c - dc, r - dr)) {
      c -= dc;
      r -= dr;
    }
    const cells: Cell[] = [];
    while (owns(c, r)) {
      cells.push({ column: c, row: r });
      c += dc;
      r += dr;
    }
    if (cells.length >= 4) lines.push({ direction, cells });
  }
  return lines;
}

/** e.g. "Four in a row (diagonal)" or "Five in a row (horizontal and vertical)". */
function describe(lines: WinLine[]): string {
  const longest = Math.max(...lines.map((line) => line.cells.length));
  const names = lines.map((line) =>
    line.direction === 'HORIZONTAL' ? 'horizontal' : line.direction === 'VERTICAL' ? 'vertical' : 'diagonal',
  );
  const directions = [...new Set(names)].join(' and ');
  return `${COUNT_WORDS[Math.min(longest, COUNT_WORDS.length - 1)]} in a row (${directions})`;
}
