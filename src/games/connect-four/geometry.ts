// Board geometry in SVG user units. Everything is drawn in this fixed coordinate system and the
// SVG scales as a whole, so cells and discs can never change size.
import type { Side } from '../../api/types';
import type { ConnectFourState } from './types';

export const COLUMNS = 7;
export const ROWS = 6;
export const CELL = 100;
export const FRAME = 24;
/** Strip above the frame where the preview disc hovers. */
export const PREVIEW = 96;
export const DISC_R = CELL * 0.4;
export const HOLE_R = CELL * 0.44;

export const VIEW_W = COLUMNS * CELL + 2 * FRAME;
export const VIEW_H = PREVIEW + ROWS * CELL + 2 * FRAME;

/** Centre of a cell. Column 0 is on the left; row 0 is the bottom row. */
export function cellCenter(column: number, row: number): { x: number; y: number } {
  return {
    x: FRAME + column * CELL + CELL / 2,
    y: PREVIEW + FRAME + (ROWS - 1 - row) * CELL + CELL / 2,
  };
}

export function columnX(column: number): number {
  return FRAME + column * CELL + CELL / 2;
}

export const PREVIEW_Y = PREVIEW / 2;

/** Gravity feel: a longer fall takes a little longer. */
export function dropDuration(row: number): number {
  return 260 + (ROWS - row) * 45;
}

/** What the board looks like right after a drop, drawn while the server confirms it. */
export function previewDrop(state: ConnectFourState, column: number, side: Side): ConnectFourState {
  const columns = state.columns.map((discs, i) => (i === column ? [...discs, side] : discs));
  return {
    columns,
    sideToMove: side === 'P1' ? 'P2' : 'P1',
    winningLines: [],
    lastDrop: { column, row: state.columns[column].length },
  };
}
