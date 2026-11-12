// Board geometry in SVG user units, drawn from P1's (the human's) side: home board bottom-right,
// checkers travelling counter-clockwise from the top-right, bar down the middle, tray on the right.
import type { Side } from '../../api/types';
import { BAR, OFF, type BackgammonState, type Step } from './types';

export const FRAME = 24;
export const POINT_W = 66;
export const BAR_W = 64;
export const TRAY_W = 100;
export const R = 30;
export const POINT_H = 5 * 2 * R;
export const MID_GAP = 80;
export const HALF_W = 6 * POINT_W;
export const VIEW_W = FRAME + HALF_W + BAR_W + HALF_W + TRAY_W + FRAME;
export const VIEW_H = FRAME + POINT_H + MID_GAP + POINT_H + FRAME;
export const BAR_X = FRAME + HALF_W + BAR_W / 2;
export const TRAY_X = VIEW_W - FRAME - TRAY_W;
/** Stacks show at most five checkers; a badge on the fifth gives the count. */
export const MAX_STACK = 5;
export const OFF_SCALE = 0.42;

/**
 * Screen slot of P1's point p (1–24). The bottom row holds 12…1 from left to right, the top row
 * 13…24, so P1's 1-point is bottom-right and its 24-point top-right.
 */
export function pointSlot(point: number): { column: number; top: boolean } {
  return point <= 12 ? { column: 12 - point, top: false } : { column: point - 13, top: true };
}

export function columnX(column: number): number {
  return FRAME + column * POINT_W + (column >= 6 ? BAR_W : 0);
}

/** Centre of the n-th checker (0 = base) on P1's point p. */
export function checkerOnPoint(point: number, index: number): { x: number; y: number } {
  const { column, top } = pointSlot(point);
  const i = Math.min(index, MAX_STACK - 1);
  const x = columnX(column) + POINT_W / 2;
  return { x, y: top ? FRAME + R + i * 2 * R : VIEW_H - FRAME - R - i * 2 * R };
}

/** P1's bar checkers sit below the middle, P2's above it. */
export function checkerOnBar(side: Side, index: number): { x: number; y: number } {
  const offset = 6 + R + Math.min(index, 3) * 2 * R;
  return { x: BAR_X, y: side === 'P1' ? VIEW_H / 2 + offset : VIEW_H / 2 - offset };
}

/** Borne-off checkers fill a 3 × 5 grid in the tray: P1's at the bottom, P2's at the top. */
export function checkerOff(side: Side, index: number): { x: number; y: number } {
  const column = index % 3;
  const row = Math.floor(index / 3);
  const x = TRAY_X + 22 + column * 28;
  const y = side === 'P1' ? VIEW_H - FRAME - 18 - row * 28 : FRAME + 18 + row * 28;
  return { x, y };
}

/** A mover's own point number as P1's point number (the screen's numbering). */
export function toScreenPoint(point: number, side: Side): number {
  return side === 'P1' ? point : 25 - point;
}

export function pipCount(state: BackgammonState, side: Side): number {
  let pips = 25 * (side === 'P1' ? state.barP1 : state.barP2);
  state.points.forEach((count, i) => {
    if (side === 'P1' && count > 0) pips += (i + 1) * count;
    if (side === 'P2' && count < 0) pips += (24 - i) * -count;
  });
  return pips;
}

/** The board right after one step, drawn while the human builds a turn or a turn animates. */
export function applyStep(state: BackgammonState, side: Side, step: Step): BackgammonState {
  const points = [...state.points];
  const sign = side === 'P1' ? 1 : -1;
  let { barP1, barP2, offP1, offP2 } = state;
  if (step.from === BAR) {
    if (side === 'P1') barP1--;
    else barP2--;
  } else {
    points[toScreenPoint(step.from, side) - 1] -= sign;
  }
  if (step.to === OFF) {
    if (side === 'P1') offP1++;
    else offP2++;
  } else {
    const index = toScreenPoint(step.to, side) - 1;
    if (points[index] === -sign) {
      points[index] = 0;
      if (side === 'P1') barP2++;
      else barP1++;
    }
    points[index] += sign;
  }
  return { ...state, points, barP1, barP2, offP1, offP2 };
}
