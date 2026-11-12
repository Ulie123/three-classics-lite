import type { Difficulty } from '../api/types';
import type { ConnectFourMove, ConnectFourState } from '../games/connect-four/types';
import { COLUMNS, ROWS, connectFourEngine } from './connectFour';
import { type AiPlayer, type Rng, now } from './core';

/*
 * Port of ConnectFourAi.java. The Java version keeps each side's discs in a 49-bit long (bit
 * column * 7 + row). JavaScript bitwise operators are 32-bit, so here the board is split in two
 * halves: columns 0–3 in `lo` (bits 0–27) and columns 4–6 in `hi` (bits 0–20). Wins are found
 * through the precomputed windows of four that pass through the landing cell.
 */

const STRIDE = ROWS + 1;
const CELLS = COLUMNS * ROWS;
const CENTER = Math.floor(COLUMNS / 2);
const ORDER = [3, 2, 4, 1, 5, 0, 6];
const WIN = 1_000_000;
const MEDIUM_DEPTH = 5;
const MEDIUM_TOLERANCE = 3;
/** Value of an open window holding 0..4 of one side's discs (four is scored as a win). */
const WEIGHTS = [0, 1, 4, 20, 0];

const isHi = (column: number) => column >= 4;
const shiftOf = (column: number) => (isHi(column) ? (column - 4) * STRIDE : column * STRIDE);
const BOTTOM = Array.from({ length: COLUMNS }, (_, c) => 1 << shiftOf(c));
const TOP = Array.from({ length: COLUMNS }, (_, c) => 1 << (shiftOf(c) + ROWS - 1));
const COLUMN_MASK = Array.from({ length: COLUMNS }, (_, c) => ((1 << ROWS) - 1) << shiftOf(c));

interface Window {
  lo: number;
  hi: number;
}

const cellBits = (column: number, row: number): Window =>
  isHi(column) ? { lo: 0, hi: 1 << (shiftOf(column) + row) } : { lo: 1 << (shiftOf(column) + row), hi: 0 };

/** Every line of four on the board, and for each cell the lines through it. */
const WINDOWS: Window[] = [];
const WINDOWS_THROUGH: Window[][] = Array.from({ length: COLUMNS * STRIDE }, () => []);
for (let column = 0; column < COLUMNS; column++) {
  for (let row = 0; row < ROWS; row++) {
    for (const [dc, dr] of [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, -1],
    ]) {
      const endColumn = column + 3 * dc;
      const endRow = row + 3 * dr;
      if (endColumn < 0 || endColumn >= COLUMNS || endRow < 0 || endRow >= ROWS) continue;
      const window: Window = { lo: 0, hi: 0 };
      const cells: number[] = [];
      for (let i = 0; i < 4; i++) {
        const bits = cellBits(column + i * dc, row + i * dr);
        window.lo |= bits.lo;
        window.hi |= bits.hi;
        cells.push((column + i * dc) * STRIDE + row + i * dr);
      }
      WINDOWS.push(window);
      for (const cell of cells) WINDOWS_THROUGH[cell].push(window);
    }
  }
}

function popcount(x: number): number {
  x -= (x >>> 1) & 0x55555555;
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  x = (x + (x >>> 4)) & 0x0f0f0f0f;
  return Math.imul(x, 0x01010101) >>> 24;
}

/** The side to move's discs (`cur`) and all discs (`mask`), each split into two 32-bit halves. */
class Board {
  curLo = 0;
  curHi = 0;
  maskLo = 0;
  maskHi = 0;
  moves = 0;

  static of(state: ConnectFourState): Board {
    const board = new Board();
    for (let column = 0; column < COLUMNS; column++) {
      state.columns[column].forEach((side, row) => {
        const bits = cellBits(column, row);
        board.maskLo |= bits.lo;
        board.maskHi |= bits.hi;
        if (side === state.sideToMove) {
          board.curLo |= bits.lo;
          board.curHi |= bits.hi;
        }
        board.moves++;
      });
    }
    return board;
  }

  canPlay(column: number): boolean {
    return ((isHi(column) ? this.maskHi : this.maskLo) & TOP[column]) === 0;
  }

  play(column: number): void {
    this.curLo ^= this.maskLo;
    this.curHi ^= this.maskHi;
    if (isHi(column)) this.maskHi |= this.maskHi + BOTTOM[column];
    else this.maskLo |= this.maskLo + BOTTOM[column];
    this.moves++;
  }

  /** True if the side to move would complete four in a row by playing this column. */
  isWinningMove(column: number): boolean {
    const hi = isHi(column);
    const landing = ((hi ? this.maskHi : this.maskLo) + BOTTOM[column]) & COLUMN_MASK[column];
    const row = 31 - Math.clz32(landing) - shiftOf(column);
    const lo = hi ? this.curLo : this.curLo | landing;
    const high = hi ? this.curHi | landing : this.curHi;
    for (const w of WINDOWS_THROUGH[column * STRIDE + row]) {
      if ((lo & w.lo) === w.lo && (high & w.hi) === w.hi) return true;
    }
    return false;
  }

  /** current + mask over all 49 bits: unique per position, exact in a double. */
  key(): number {
    return (this.curHi + this.maskHi) * 0x1000_0000 + (this.curLo + this.maskLo);
  }

  /** The same board with the other side to move's discs as `cur`, for spotting their threats. */
  flipped(): Board {
    const board = new Board();
    board.curLo = this.curLo ^ this.maskLo;
    board.curHi = this.curHi ^ this.maskHi;
    board.maskLo = this.maskLo;
    board.maskHi = this.maskHi;
    board.moves = this.moves;
    return board;
  }
}

/** Scores every window of four: open lines with more of your discs are worth more. */
function evaluate(board: Board): number {
  const mineLo = board.curLo;
  const mineHi = board.curHi;
  const theirsLo = board.curLo ^ board.maskLo;
  const theirsHi = board.curHi ^ board.maskHi;
  let score = 0;
  for (const w of WINDOWS) {
    const a = popcount(w.lo & mineLo) + popcount(w.hi & mineHi);
    const b = popcount(w.lo & theirsLo) + popcount(w.hi & theirsHi);
    if (b === 0) score += WEIGHTS[a];
    else if (a === 0) score -= WEIGHTS[b];
  }
  const center = COLUMN_MASK[CENTER];
  score += 3 * (popcount(mineLo & center) - popcount(theirsLo & center));
  return score;
}

function winningColumn(board: Board): number {
  for (const column of ORDER) {
    if (board.canPlay(column) && board.isWinningMove(column)) return column;
  }
  return -1;
}

/** Columns where the opponent would win if it were their turn. */
function opponentWins(board: Board): number[] {
  const flipped = board.flipped();
  return ORDER.filter((column) => flipped.canPlay(column) && flipped.isWinningMove(column));
}

class Timeout extends Error {}

const TABLE_SIZE = 1 << 20;
const EXACT = 0;
const LOWER = 1;
const UPPER = 2;

/** Negamax with alpha-beta and an optional transposition table and deadline. */
class Search {
  private nodes = 0;
  private readonly keys: Float64Array;
  private readonly values: Int32Array;
  private readonly depths: Int8Array;
  private readonly flags: Int8Array;
  private readonly bestMoves: Int8Array;

  constructor(
    private readonly deadline: number,
    useTable: boolean,
  ) {
    const size = useTable ? TABLE_SIZE : 1;
    this.keys = new Float64Array(size);
    this.values = new Int32Array(size);
    this.depths = new Int8Array(size);
    this.flags = new Int8Array(size);
    this.bestMoves = new Int8Array(size);
  }

  /** Returns [bestColumn, score]. */
  root(board: Board, depth: number): [number, number] {
    let alpha = -WIN * 2;
    let bestColumn = -1;
    for (const column of this.ordered(board, this.tableMove(board))) {
      const score = -this.child(board, column, depth - 1, -WIN * 2, -alpha, 1);
      if (bestColumn < 0 || score > alpha) {
        alpha = score;
        bestColumn = column;
      }
    }
    this.store(board, depth, alpha, EXACT, bestColumn);
    return [bestColumn, alpha];
  }

  /** Plays a column, searches the resulting position, then takes the move back. */
  child(board: Board, column: number, depth: number, alpha: number, beta: number, ply: number): number {
    const { curLo, curHi, maskLo, maskHi, moves } = board;
    board.play(column);
    try {
      return this.negamax(board, depth, alpha, beta, ply);
    } finally {
      board.curLo = curLo;
      board.curHi = curHi;
      board.maskLo = maskLo;
      board.maskHi = maskHi;
      board.moves = moves;
    }
  }

  negamax(board: Board, depth: number, alpha: number, beta: number, ply: number): number {
    if ((++this.nodes & 4095) === 0 && now() > this.deadline) throw new Timeout();
    if (board.moves === CELLS) return 0;
    for (const column of ORDER) {
      if (board.canPlay(column) && board.isWinningMove(column)) return WIN - ply;
    }
    if (depth <= 0) return evaluate(board);

    const originalAlpha = alpha;
    const slot = this.slot(board);
    const key = board.key();
    if (this.keys.length > 1 && this.keys[slot] === key && this.depths[slot] >= depth) {
      const value = this.values[slot];
      if (this.flags[slot] === EXACT) return value;
      if (this.flags[slot] === LOWER) alpha = Math.max(alpha, value);
      else beta = Math.min(beta, value);
      if (alpha >= beta) return value;
    }

    let best = -WIN * 2;
    let bestColumn = -1;
    for (const column of this.ordered(board, this.tableMove(board))) {
      const score = -this.child(board, column, depth - 1, -beta, -alpha, ply + 1);
      if (score > best) {
        best = score;
        bestColumn = column;
      }
      alpha = Math.max(alpha, score);
      if (alpha >= beta) break;
    }

    const flag = best <= originalAlpha ? UPPER : best >= beta ? LOWER : EXACT;
    this.store(board, depth, best, flag, bestColumn);
    return best;
  }

  private tableMove(board: Board): number {
    const slot = this.slot(board);
    return this.keys.length > 1 && this.keys[slot] === board.key() ? this.bestMoves[slot] : -1;
  }

  private store(board: Board, depth: number, value: number, flag: number, bestColumn: number) {
    if (this.keys.length === 1 || bestColumn < 0) return;
    const slot = this.slot(board);
    this.keys[slot] = board.key();
    this.values[slot] = value;
    this.depths[slot] = depth;
    this.flags[slot] = flag;
    this.bestMoves[slot] = bestColumn;
  }

  /** (key ^ (key >>> 29)) & (size - 1), as in the Java version. */
  private slot(board: Board): number {
    const key = board.key();
    const high = Math.floor(key / 0x2000_0000);
    const low = key - high * 0x2000_0000;
    return (low ^ high) & (this.keys.length - 1);
  }

  /** Playable columns, the table's best move first, then centre outwards. */
  private ordered(board: Board, first: number): number[] {
    const columns: number[] = [];
    if (first >= 0 && board.canPlay(first)) columns.push(first);
    for (const column of ORDER) {
      if (column !== first && board.canPlay(column)) columns.push(column);
    }
    return columns;
  }
}

function easy(board: Board, legal: ConnectFourMove[], rng: Rng): number {
  if (rng.bool()) {
    const win = winningColumn(board);
    if (win >= 0) return win;
  }
  if (rng.bool()) {
    const threats = opponentWins(board);
    if (threats.length > 0) return threats[0];
  }
  return legal[rng.int(legal.length)].column;
}

function medium(board: Board, rng: Rng): number {
  if (board.moves === 0) return CENTER - 1 + rng.int(3); // vary the opening
  const win = winningColumn(board);
  if (win >= 0) return win;

  const search = new Search(Infinity, false);
  const scores: number[] = [];
  let best = -Infinity;
  for (const column of ORDER) {
    if (!board.canPlay(column)) continue;
    scores[column] = -search.child(board, column, MEDIUM_DEPTH - 1, -WIN * 2, WIN * 2, 1);
    best = Math.max(best, scores[column]);
  }
  const nearBest = ORDER.filter((column) => board.canPlay(column) && scores[column] >= best - MEDIUM_TOLERANCE);
  return nearBest[rng.int(nearBest.length)];
}

function hard(board: Board, budgetMs: number): number {
  if (board.moves === 0) return CENTER; // the first player wins by opening in the centre
  const win = winningColumn(board);
  if (win >= 0) return win;
  const threats = opponentWins(board);
  if (threats.length === 1) return threats[0];

  const deadline = now() + budgetMs * 0.85;
  const search = new Search(deadline, true);
  let bestColumn = ORDER.find((column) => board.canPlay(column))!;
  const remaining = CELLS - board.moves;
  for (let depth = 1; depth <= remaining; depth++) {
    try {
      const [column, score] = search.root(board, depth);
      bestColumn = column;
      if (Math.abs(score) >= WIN - CELLS) break; // forced result found
    } catch (error) {
      if (error instanceof Timeout) break;
      throw error;
    }
  }
  return bestColumn;
}

/**
 * Easy is mostly random. Medium searches five plies with a window heuristic. Hard runs negamax with
 * alpha-beta, a transposition table and iterative deepening inside the time budget.
 */
export const connectFourAi: AiPlayer<ConnectFourState, ConnectFourMove> = {
  chooseMove(state: ConnectFourState, difficulty: Difficulty, rng: Rng, budgetMs: number) {
    const legal = connectFourEngine.legalMoves(state);
    if (legal.length === 0) throw new Error('No legal moves to choose from');
    const board = Board.of(state);
    const column =
      difficulty === 'EASY' ? easy(board, legal, rng) : difficulty === 'MEDIUM' ? medium(board, rng) : hard(board, budgetMs);
    return { column };
  },
};

/** For tests: the static evaluation of a position from the side to move's point of view. */
export const evaluateConnectFour = (state: ConnectFourState) => evaluate(Board.of(state));
