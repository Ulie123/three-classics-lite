import { describe, expect, it } from 'vitest';
import { FRAME, VIEW_H, VIEW_W, applyStep, checkerOnPoint, pipCount, pointSlot, toScreenPoint } from './geometry';
import type { BackgammonState } from './types';

const start: BackgammonState = {
  points: (() => {
    const points = Array(24).fill(0);
    points[23] = 2;
    points[12] = 5;
    points[7] = 3;
    points[5] = 5;
    points[0] = -2;
    points[11] = -5;
    points[16] = -3;
    points[18] = -5;
    return points;
  })(),
  barP1: 0,
  barP2: 0,
  offP1: 0,
  offP2: 0,
  sideToMove: 'P1',
  phase: 'MOVE',
  dice: [3, 1],
  opening: null,
  notices: [],
  lastTurn: null,
};

describe('backgammon board orientation', () => {
  it("puts the human's home board bottom-right and the 24-point top-right", () => {
    expect(pointSlot(1)).toEqual({ column: 11, top: false });
    expect(pointSlot(6)).toEqual({ column: 6, top: false });
    expect(pointSlot(12)).toEqual({ column: 0, top: false });
    expect(pointSlot(13)).toEqual({ column: 0, top: true });
    expect(pointSlot(24)).toEqual({ column: 11, top: true });
  });

  it('travels counter-clockwise: right to left across the top, left to right along the bottom', () => {
    for (let p = 24; p > 13; p--) expect(checkerOnPoint(p - 1, 0).x).toBeLessThan(checkerOnPoint(p, 0).x);
    expect(checkerOnPoint(12, 0).x).toBe(checkerOnPoint(13, 0).x);
    for (let p = 12; p > 1; p--) expect(checkerOnPoint(p - 1, 0).x).toBeGreaterThan(checkerOnPoint(p, 0).x);
  });

  it('keeps every stack, even a tall one, inside its half of the board', () => {
    for (let p = 1; p <= 24; p++) {
      for (let i = 0; i < 15; i++) {
        const { x, y } = checkerOnPoint(p, i);
        expect(x).toBeGreaterThan(FRAME);
        expect(x).toBeLessThan(VIEW_W);
        if (p <= 12) expect(y).toBeGreaterThan(VIEW_H / 2);
        else expect(y).toBeLessThan(VIEW_H / 2);
      }
    }
  });

  it("maps the opponent's point q to the screen's point 25 − q", () => {
    expect(toScreenPoint(24, 'P2')).toBe(1);
    expect(toScreenPoint(6, 'P2')).toBe(19);
    expect(toScreenPoint(6, 'P1')).toBe(6);
  });
});

describe('backgammon display helpers', () => {
  it('counts 167 pips each at the start', () => {
    expect(pipCount(start, 'P1')).toBe(167);
    expect(pipCount(start, 'P2')).toBe(167);
  });

  it('moves a checker and sends a hit blot to the bar', () => {
    const blot = { ...start, points: start.points.map((c, i) => (i === 4 ? -1 : c)) };
    const next = applyStep(blot, 'P1', { from: 8, to: 5, die: 3, hit: true });
    expect(next.points[7]).toBe(2);
    expect(next.points[4]).toBe(1);
    expect(next.barP2).toBe(1);
  });

  it("applies the opponent's steps in its own numbering", () => {
    const next = applyStep(start, 'P2', { from: 24, to: 21, die: 3, hit: false });
    expect(next.points[0]).toBe(-1);
    expect(next.points[3]).toBe(-1);
  });
});
