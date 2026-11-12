import { describe, expect, it } from 'vitest';
import { ApiError } from '../api/errors';
import type { GameView, NewGameRequest } from '../api/types';
import { seededRng } from '../engine/core';
import { chooseInPage } from './aiRunner';
import { Referee, rematchSide } from './referee';
import { GameStore } from './store';
import { checkers } from '../engine/testkit';

/* The referee, ported from the full project's API tests (GameApiTest) and RematchPolicyTest. */

const fresh = () => new Referee(new GameStore(), chooseInPage, seededRng(9));
const newConnectFour = (referee: Referee, extra: Partial<NewGameRequest> = {}) =>
  referee.create({ type: 'CONNECT_FOUR', mode: 'VS_AI', difficulty: 'EASY', ...extra });

async function problem(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error('Expected the call to fail');
}

describe('referee', () => {
  it('creates a game and the computer replies', async () => {
    const referee = fresh();
    const { game } = await newConnectFour(referee);
    expect(game.status).toBe('IN_PROGRESS');
    expect(game.humanSide).toBe('P1');
    expect(game.legalMoves).toHaveLength(7);

    const result = await referee.play(game.id, game.version, { column: 3 });
    expect(result.events.map((event) => event.actor)).toEqual(['HUMAN', 'AI']);
    expect(result.game.version).toBeGreaterThan(game.version);
    expect(result.game.history).toHaveLength(2);
    expect(result.game.lastMove?.actor).toBe('AI');
    expect((await referee.get(game.id)).history).toHaveLength(2);
  });

  it('answers an illegal move with a 400', async () => {
    const referee = fresh();
    const { game } = await newConnectFour(referee);
    const error = await problem(referee.play(game.id, game.version, { column: 9 }));
    expect(error.status).toBe(400);
    expect(error.problem.title).toBe('Illegal move');
    expect(error.message).toBe('There is no column 9.');
    expect((await problem(referee.play(game.id, game.version, { column: 'middle' }))).problem.title).toBe('Illegal move');
  });

  it('answers a stale version with a 409', async () => {
    const referee = fresh();
    const { game } = await newConnectFour(referee);
    await referee.play(game.id, game.version, { column: 0 });
    // The same request again, e.g. a double click, is based on an outdated version.
    const error = await problem(referee.play(game.id, game.version, { column: 0 }));
    expect(error.isStale).toBe(true);
    expect(error.problem.title).toBe('Stale game version');
  });

  it('answers an unknown game with a 404', async () => {
    const error = await problem(fresh().get('00000000-0000-0000-0000-000000000000'));
    expect(error.isNotFound).toBe(true);
    expect(error.problem.title).toBe('Game not found');
  });

  it('swaps who starts a Connect Four rematch', async () => {
    const referee = fresh();
    const first = await newConnectFour(referee);
    const rematch = await newConnectFour(referee, { rematchOf: first.game.id });
    expect(rematch.game.humanSide).toBe('P2');
    // The computer now moves first, and its opening arrives as an event.
    expect(rematch.events).toHaveLength(1);
    expect(rematch.game.history).toHaveLength(1);
  });

  it('finishes a game won from a custom position and counts it in the stats', async () => {
    const referee = fresh();
    const state = {
      columns: [['P1', 'P2'], ['P1', 'P2'], ['P1', 'P2'], [], [], [], []],
      sideToMove: 'P1',
      winningLines: [],
      lastDrop: null,
    };
    const { game } = await referee.createFromState({ type: 'CONNECT_FOUR', mode: 'VS_AI', difficulty: 'HARD' }, state);
    const result = await referee.play(game.id, game.version, { column: 3 });
    const finished = result.game as GameView<{ winningLines: unknown[] }, unknown>;
    expect(finished.status).toBe('FINISHED');
    expect(finished.outcome).toEqual({ winner: 'P1', reason: 'Four in a row (horizontal)', points: 1, draw: false });
    expect(finished.legalMoves).toEqual([]);
    expect(finished.state.winningLines).toHaveLength(1);
    const hard = (await referee.stats()).find((row) => row.type === 'CONNECT_FOUR' && row.difficulty === 'HARD');
    expect(hard).toEqual({ type: 'CONNECT_FOUR', difficulty: 'HARD', wins: 1, losses: 0, draws: 0 });
    expect((await problem(referee.play(game.id, finished.version, { column: 4 }))).status).toBe(400);
  });

  it('lists stats for every game and difficulty', async () => {
    const stats = await fresh().stats();
    expect(stats).toHaveLength(9);
    expect(stats[0]).toEqual({ type: 'CONNECT_FOUR', difficulty: 'EASY', wins: 0, losses: 0, draws: 0 });
  });

  it('plays the backgammon opening roll and passes the dice to the board', async () => {
    const referee = fresh();
    const { game } = await referee.create({ type: 'BACKGAMMON', mode: 'LOCAL', difficulty: 'EASY' });
    expect(game.legalMoves).toEqual([{ kind: 'ROLL', steps: [], dice: null }]);
    const rolled = await referee.play(game.id, game.version, { kind: 'ROLL' });
    expect(rolled.events[0].move).toMatchObject({ kind: 'OPENING' });
    expect(rolled.game.moveGraph).not.toBeNull();
  });

  it('lets the computer open when the human plays second', async () => {
    const referee = fresh();
    const { board, sideToMove } = checkers({ d: 'c3', l: 'h8' }, 'P1');
    const created = await referee.createFromState(
      { type: 'CHECKERS', mode: 'VS_AI', difficulty: 'EASY', humanSide: 'P2' },
      { board, sideToMove, quietPlies: 0, positions: null },
    );
    // The computer (Dark) moved on creation, so it is Light's turn.
    expect(created.events.map((event) => event.actor)).toEqual(['AI']);
    expect(created.game.sideToMove).toBe('P2');
    expect(created.game.legalMoves.length).toBeGreaterThan(0);
  });
});

describe('rematch seats', () => {
  const request = (extra: Partial<NewGameRequest>): NewGameRequest => ({
    type: 'CONNECT_FOUR',
    mode: 'VS_AI',
    difficulty: 'EASY',
    ...extra,
  });

  it('alternates the Connect Four starter', () => {
    expect(rematchSide(request({}), 'P1')).toBe('P2');
    expect(rematchSide(request({}), 'P2')).toBe('P1');
  });

  it('lets an explicit choice win', () => {
    expect(rematchSide(request({ humanSide: 'P1' }), 'P1')).toBe('P1');
  });

  it('keeps the human seat in other games', () => {
    expect(rematchSide(request({ type: 'CHECKERS' }), 'P2')).toBe('P2');
  });

  it('defaults to the human moving first', () => {
    expect(rematchSide(request({}), null)).toBe('P1');
  });

  it('always seats player one first in local games', () => {
    expect(rematchSide(request({ mode: 'LOCAL', humanSide: 'P2' }), 'P2')).toBe('P1');
  });
});
