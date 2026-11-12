import { describe, expect, it } from 'vitest';
import { CELL, COLUMNS, ROWS, VIEW_H, VIEW_W, cellCenter, previewDrop } from './geometry';
import type { ConnectFourState } from './types';

describe('Connect Four board mapping', () => {
  it('puts column 0 on the left and row 0 at the bottom', () => {
    const bottomLeft = cellCenter(0, 0);
    const topRight = cellCenter(COLUMNS - 1, ROWS - 1);
    expect(bottomLeft.x).toBeLessThan(topRight.x);
    expect(bottomLeft.y).toBeGreaterThan(topRight.y);
  });

  it('spaces every cell exactly one cell apart inside the view box', () => {
    for (let column = 0; column < COLUMNS; column++) {
      for (let row = 0; row < ROWS; row++) {
        const { x, y } = cellCenter(column, row);
        expect(x - CELL / 2).toBeGreaterThanOrEqual(0);
        expect(x + CELL / 2).toBeLessThanOrEqual(VIEW_W);
        expect(y + CELL / 2).toBeLessThanOrEqual(VIEW_H);
        if (column > 0) expect(x - cellCenter(column - 1, row).x).toBe(CELL);
        if (row > 0) expect(cellCenter(column, row - 1).y - y).toBe(CELL);
      }
    }
  });

  it('previews a drop at the lowest empty slot', () => {
    const state: ConnectFourState = {
      columns: [['P1', 'P2'], [], [], [], [], [], []],
      sideToMove: 'P1',
      winningLines: [],
      lastDrop: null,
    };
    const next = previewDrop(state, 0, 'P1');
    expect(next.columns[0]).toEqual(['P1', 'P2', 'P1']);
    expect(next.lastDrop).toEqual({ column: 0, row: 2 });
    expect(next.sideToMove).toBe('P2');
    expect(state.columns[0]).toHaveLength(2);
  });
});
