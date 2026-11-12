import { referee } from '../local/referee';
import type { GameView, MoveResult, NewGameRequest, StatsEntry } from './types';

export { ApiError } from './errors';

/**
 * The same four calls as the full project's REST client, answered by the in-browser referee instead
 * of a server. Results are copied as if they had crossed the network, so callers can't change the
 * stored games by accident.
 */
const copy = <T>(value: T): T => (value === undefined ? value : (JSON.parse(JSON.stringify(value)) as T));

export const api = {
  async createGame<S, M>(body: NewGameRequest): Promise<MoveResult<S, M>> {
    return copy(await referee.create(copy(body))) as MoveResult<S, M>;
  },

  async getGame<S, M>(id: string): Promise<GameView<S, M>> {
    return copy(await referee.get(id)) as GameView<S, M>;
  },

  async move<S, M>(id: string, version: number, move: M): Promise<MoveResult<S, M>> {
    return copy(await referee.play(id, version, copy(move))) as MoveResult<S, M>;
  },

  async stats(): Promise<StatsEntry[]> {
    return copy(await referee.stats());
  },
};
