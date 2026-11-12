import { describe, expect, it } from 'vitest';
import { ROLL, backgammonEngine, isClosedOut } from './backgammon';
import { Position, legalTurns } from './backgammonPosition';
import { checkersEngine } from './checkers';
import { connectFourEngine } from './connectFour';
import { IllegalMoveError, draw, win } from './core';
import { backgammon, checkers, connectFour, dice, jump, move, sq, step } from './testkit';
import type { BackgammonState } from '../games/backgammon/types';

/* Rule cases that random play rarely reaches, ported from the Java engine tests. */

const noDice = dice();
const turns = (state: BackgammonState) => legalTurns(Position.of(state, state.sideToMove), state.dice[0], state.dice[1]);

describe('Connect Four rules', () => {
  it('rejects a full column and columns off the board', () => {
    const state = connectFour(
      `
      X......
      O......
      X......
      O......
      X......
      O......`,
      'P1',
    );
    expect(() => connectFourEngine.apply(state, { column: 0 }, noDice)).toThrow('Column 1 is full.');
    expect(() => connectFourEngine.apply(state, { column: 7 }, noDice)).toThrow(IllegalMoveError);
    expect(connectFourEngine.legalMoves(state).map((m) => m.column)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('calls a full board without four in a row a draw', () => {
    const state = connectFour(
      `
      OXOXOXO
      OXOXOXO
      XOXOXOX
      XOXOXOX
      OXOXOXO
      OXOXOXO`,
      'P1',
    );
    expect(connectFourEngine.outcome(state)).toEqual(draw('The board is full'));
    expect(connectFourEngine.legalMoves(state)).toEqual([]);
  });

  it('stops accepting moves after a win', () => {
    let state = connectFourEngine.initialState();
    for (const column of [0, 1, 0, 1, 0, 1, 0]) state = connectFourEngine.apply(state, { column }, noDice);
    expect(connectFourEngine.outcome(state)).toEqual(win('P1', 'Four in a row (vertical)'));
    expect(() => connectFourEngine.apply(state, { column: 2 }, noDice)).toThrow('The game is already over.');
  });
});

describe('Checkers rules', () => {
  it('ends the move when a man is crowned mid-jump', () => {
    const state = checkers({ d: 'd6', l: 'e7 g7' }, 'P1');
    expect(checkersEngine.legalMoves(state)).toEqual([jump(['d6', 'f8'], ['e7'])]);
    const after = checkersEngine.apply(state, jump(['d6', 'f8'], ['e7']), noDice);
    expect(after.board[sq('f8')]).toBe('D');
    expect(after.board[sq('g7')]).toBe('l');
  });

  it('insists on a capture when one is available', () => {
    const state = checkers({ d: 'c3 a1', l: 'd4' }, 'P1');
    expect(() => checkersEngine.apply(state, move('a1', 'b2'), noDice)).toThrow(
      'A capture is available, so you must capture.',
    );
  });

  it('draws after 40 moves each without a capture or man move', () => {
    const state = checkers({ D: 'a1', L: 'h8' }, 'P1', 79);
    const after = checkersEngine.apply(state, move('a1', 'b2'), noDice);
    expect(after.quietPlies).toBe(80);
    expect(checkersEngine.outcome(after)).toEqual(draw('Draw by 40-move rule'));
  });

  it('resets the 40-move count when a man moves', () => {
    const state = checkers({ d: 'c3', L: 'h8' }, 'P1', 79);
    const after = checkersEngine.apply(state, move('c3', 'd4'), noDice);
    expect(after.quietPlies).toBe(0);
    expect(checkersEngine.outcome(after)).toBeNull();
  });

  it('draws on threefold repetition', () => {
    let state = checkers({ D: 'a1', L: 'h8' }, 'P1');
    const cycle = [move('a1', 'b2'), move('h8', 'g7'), move('b2', 'a1'), move('g7', 'h8')];
    for (const next of cycle) state = checkersEngine.apply(state, next, noDice);
    expect(checkersEngine.outcome(state)).toBeNull();
    for (const next of cycle) state = checkersEngine.apply(state, next, noDice);
    expect(checkersEngine.outcome(state)).toEqual(draw('Draw by threefold repetition'));
    expect(checkersEngine.legalMoves(state)).toEqual([]);
  });

  it('fills in missing position history like the Java record does', () => {
    const state = checkersEngine.normalize({ ...checkers({ d: 'c3', l: 'd4' }, 'P1'), positions: null as never });
    expect(state.positions).toHaveLength(1);
  });
});

describe('Backgammon rules', () => {
  it('re-rolls opening ties; the higher die plays both dice', () => {
    const start = backgammonEngine.initialState();
    const rolled = backgammonEngine.apply(start, ROLL, dice(3, 3, 5, 2));
    expect(rolled.sideToMove).toBe('P1');
    expect(rolled.dice).toEqual([5, 2]);
    expect(rolled.opening).toEqual([5, 2]);
    expect(backgammonEngine.recorded(start, ROLL, rolled)).toEqual({ kind: 'OPENING', steps: [], dice: [5, 2] });
    expect(backgammonEngine.apply(start, ROLL, dice(1, 6)).sideToMove).toBe('P2');
  });

  it('forfeits the turn when entry is blocked', () => {
    const state = backgammon({ 25: 1, 6: 14 }, { 6: 2, 5: 2, 12: 11 }, 'P1');
    const after = backgammonEngine.apply(state, ROLL, dice(6, 5));
    expect(after.sideToMove).toBe('P2');
    expect(after.phase).toBe('ROLL');
    expect(after.notices).toEqual([{ kind: 'NO_MOVES', side: 'P1' }]);
  });

  it('passes the turn without rolling when closed out', () => {
    const state = backgammon({ 25: 1, 6: 14 }, { 1: 2, 2: 2, 3: 2, 4: 2, 5: 2, 6: 2, 8: 3 }, 'P2', [1, 2]);
    const safe = { kind: 'TURN' as const, steps: [step(8, 7, 1), step(8, 6, 2)], dice: [1, 2] };
    const after = backgammonEngine.apply(state, safe, noDice);
    expect(isClosedOut(after, 'P1')).toBe(true);
    expect(after.notices).toEqual([{ kind: 'CLOSED_OUT', side: 'P1' }]);
    expect(after.sideToMove).toBe('P2');
    expect(after.phase).toBe('ROLL');
  });

  it('uses as many dice as possible', () => {
    const state = backgammon({ 20: 1, 7: 1, 1: 13 }, { 11: 2, 16: 13 }, 'P1', [6, 3]);
    const all = turns(state);
    expect(all.every((sequence) => sequence.length === 2)).toBe(true);
    expect(all).toContainEqual([step(7, 1, 6), step(20, 17, 3)]);
    expect(all.some((sequence) => sequence[0].from === 7 && sequence[0].die === 3)).toBe(false);
  });

  it('plays the larger die when only one can be used', () => {
    const state = backgammon({ 20: 1, 1: 14 }, { 14: 2, 16: 13 }, 'P1', [6, 3]);
    expect(turns(state)).toEqual([[step(20, 14, 6)]]);
    const smaller = { kind: 'TURN' as const, steps: [step(20, 17, 3)], dice: [6, 3] };
    expect(() => backgammonEngine.apply(state, smaller, noDice)).toThrow(IllegalMoveError);
  });

  it('bears off with a higher die only from the highest point', () => {
    const state = backgammon({ 6: 1, 2: 1 }, { 1: 15 }, 'P1', [4, 1]);
    const all = turns(state);
    expect(all.some((sequence) => sequence[0].from === 2 && sequence[0].to === 0 && sequence[0].die === 4)).toBe(false);
    expect(all).toContainEqual([step(6, 2, 4), step(2, 1, 1)]);
  });

  it('stops bearing off after being hit', () => {
    const state = backgammon({ 25: 1, 6: 5, 5: 5, 4: 3 }, { 12: 15 }, 'P1', [6, 5]);
    expect(turns(state).flat().some((s) => s.to === 0)).toBe(false);
  });

  it('scores single, gammon and backgammon', () => {
    expect(backgammonEngine.outcome(backgammon({}, { 6: 12 }, 'P2'))).toEqual(win('P1', 'Single game (1 point)', 1));
    expect(backgammonEngine.outcome(backgammon({}, { 6: 15 }, 'P2'))).toEqual(win('P1', 'Gammon (2 points)', 2));
    expect(backgammonEngine.outcome(backgammon({}, { 6: 14, 20: 1 }, 'P2'))).toEqual(win('P1', 'Backgammon (3 points)', 3));
  });

  it('starts at 167 pips each', () => {
    const position = Position.of(backgammonEngine.initialState(), 'P1');
    expect(position.pips()).toBe(167);
    expect(position.theirPips()).toBe(167);
  });
});
