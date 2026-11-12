import { describe, expect, it } from 'vitest';
import { CELL, FRAME, SIZE, isPlayable, previewMove, squareAt, squareName, squareOrigin } from './geometry';
import type { CheckersState } from './types';

const sq = (name: string) => (SIZE - Number(name[1])) * SIZE + (name.charCodeAt(0) - 97);

describe('checkers board mapping', () => {
  it("puts Dark's a1 at the bottom-left when the human plays Dark", () => {
    expect(squareOrigin(sq('a1'), false)).toEqual({ x: FRAME, y: FRAME + 7 * CELL });
    expect(squareOrigin(sq('h8'), false)).toEqual({ x: FRAME + 7 * CELL, y: FRAME });
  });

  it("flips the board so Light's corner h8 is at the bottom-left for a Light player", () => {
    expect(squareOrigin(sq('h8'), true)).toEqual({ x: FRAME, y: FRAME + 7 * CELL });
    expect(squareOrigin(sq('a1'), true)).toEqual({ x: FRAME + 7 * CELL, y: FRAME });
  });

  it("keeps each player's bottom-left corner a playable square", () => {
    expect(isPlayable(squareAt(7, 0, false))).toBe(true);
    expect(isPlayable(squareAt(7, 0, true))).toBe(true);
    expect(isPlayable(squareAt(7, 1, false))).toBe(false);
  });

  it('maps screen cells back to the same squares in both orientations', () => {
    for (const flipped of [false, true]) {
      for (let square = 0; square < SIZE * SIZE; square++) {
        const { x, y } = squareOrigin(square, flipped);
        expect(squareAt((y - FRAME) / CELL, (x - FRAME) / CELL, flipped)).toBe(square);
      }
    }
  });

  it('names squares like the server does', () => {
    expect(squareName(sq('c3'))).toBe('c3');
    expect(squareName(sq('h8'))).toBe('h8');
  });

  it('previews a capture that crowns', () => {
    const board = '.'.repeat(64).split('');
    board[sq('d6')] = 'd';
    board[sq('e7')] = 'l';
    const state: CheckersState = { board: board.join(''), sideToMove: 'P1', quietPlies: 0, positions: [], lastMove: null };
    const next = previewMove(state, { path: [sq('d6'), sq('f8')], captures: [sq('e7')] });
    expect(next.board[sq('f8')]).toBe('D');
    expect(next.board[sq('e7')]).toBe('.');
    expect(next.board[sq('d6')]).toBe('.');
    expect(next.sideToMove).toBe('P2');
  });
});
