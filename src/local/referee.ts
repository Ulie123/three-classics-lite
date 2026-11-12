import { ApiError } from '../api/errors';
import type {
  Actor,
  Difficulty,
  GameEvent,
  GameMode,
  GameType,
  GameView,
  MoveResult,
  NewGameRequest,
  Side,
  StatsEntry,
} from '../api/types';
import { IllegalMoveError, opponent, type Rng, secureRng } from '../engine/core';
import { type GameModule, moduleFor } from '../engine/registry';
import { type ChooseMove, chooseInWorker } from './aiRunner';
import { GameStore, type StoredGame } from './store';

/*
 * The referee, ported from GameService.java. Every call runs to completion before the next starts:
 * load the game, check the version, validate and apply the human move, let the computer reply, then
 * save the new state and the moves. The frontend can't tell it apart from the server.
 */

const TYPES: GameType[] = ['CONNECT_FOUR', 'CHECKERS', 'BACKGAMMON'];
const DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];
const MODES: GameMode[] = ['VS_AI', 'LOCAL'];
const SIDES: Side[] = ['P1', 'P2'];
/** Hard must answer in about a second and never take more than two. */
const AI_BUDGET_MS = 1000;

const badRequest = (detail: string) => new ApiError(400, { title: 'Bad request', detail, status: 400 });
const illegal = (detail: string) => new ApiError(400, { title: 'Illegal move', detail, status: 400 });

function actorOf(mode: GameMode, mover: Side, humanSide: Side): Actor {
  if (mode === 'LOCAL') return mover;
  return mover === humanSide ? 'HUMAN' : 'AI';
}

/**
 * Which seat the human takes in a new game. An explicit choice always wins. Otherwise a Connect Four
 * rematch swaps who goes first, as the rules suggest for fairness; other games keep the human's seat.
 */
export function rematchSide(request: NewGameRequest, previousHumanSide: Side | null): Side {
  if (request.mode === 'LOCAL') return 'P1';
  if (request.humanSide) return request.humanSide;
  if (previousHumanSide) return request.type === 'CONNECT_FOUR' ? opponent(previousHumanSide) : previousHumanSide;
  return 'P1';
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

export class Referee {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly store: GameStore,
    private readonly chooseMove: ChooseMove,
    private readonly rng: Rng = secureRng,
  ) {}

  /** Creates a game. If the computer moves first, its move is already in `events`. */
  create(request: NewGameRequest): Promise<MoveResult<unknown, unknown>> {
    return this.serial(async () => {
      const normalized = this.validated(request);
      const previous = normalized.rematchOf ? this.load(normalized.rematchOf).humanSide : null;
      return this.start(normalized, rematchSide(normalized, previous), null);
    });
  }

  /** Starts a game from a custom position: the full project's dev/test endpoint, used by e2e tests. */
  createFromState(request: NewGameRequest, state: unknown): Promise<MoveResult<unknown, unknown>> {
    return this.serial(async () => {
      const normalized = this.validated(request);
      return this.start(normalized, rematchSide(normalized, null), state);
    });
  }

  get(id: string): Promise<GameView<unknown, unknown>> {
    return this.serial(async () => {
      this.store.refresh();
      const game = this.load(id);
      return this.view(moduleFor(game.type), game, game.state);
    });
  }

  play(id: string, version: number, move: unknown): Promise<MoveResult<unknown, unknown>> {
    return this.serial(async () => {
      this.store.refresh();
      const game = this.load(id);
      if (game.version !== version) {
        throw new ApiError(409, {
          title: 'Stale game version',
          detail: `Game ${id} is at version ${game.version}, not ${version}.`,
          status: 409,
        });
      }
      if (game.status === 'FINISHED') throw illegal('The game is already over.');
      const module = moduleFor(game.type);
      let state = game.state;
      if (game.mode === 'VS_AI' && module.engine.sideToMove(state) !== game.humanSide) {
        throw illegal('It is not your turn.');
      }
      if (move === null || typeof move !== 'object') throw illegal('The move could not be read.');

      const before = state;
      const events: GameEvent<unknown, unknown>[] = [];
      state = this.applyAndRecord(module, game, state, move, events);
      state = await this.letComputerPlay(module, game, state, events);
      game.version += 1;
      return this.persist(module, game, before, state, events);
    });
  }

  stats(): Promise<StatsEntry[]> {
    return this.serial(async () => {
      this.store.refresh();
      const stats = this.store.stats();
      return TYPES.flatMap((type) =>
        DIFFICULTIES.map((difficulty) => {
          const tally = stats[type]?.[difficulty] ?? { wins: 0, losses: 0, draws: 0 };
          return { type, difficulty, ...tally };
        }),
      );
    });
  }

  /** Runs calls one at a time, like the server's transactions. */
  private serial<T>(work: () => Promise<T>): Promise<T> {
    const result = this.queue.then(work, work);
    this.queue = result.catch(() => undefined);
    return result;
  }

  /** Mode defaults to VS_AI and difficulty to MEDIUM, as in CreateGameRequest. */
  private validated(request: NewGameRequest): NewGameRequest {
    if (!request || !TYPES.includes(request.type)) throw badRequest('The game type is missing or unknown.');
    const mode = request.mode ?? 'VS_AI';
    const difficulty = request.difficulty ?? 'MEDIUM';
    if (!MODES.includes(mode) || !DIFFICULTIES.includes(difficulty)) throw badRequest('Unknown mode or difficulty.');
    if (request.humanSide && !SIDES.includes(request.humanSide)) throw badRequest('Unknown side.');
    return { ...request, mode, difficulty };
  }

  private load(id: string): StoredGame {
    const game = this.store.find(id);
    if (!game) throw new ApiError(404, { title: 'Game not found', detail: `No game with id ${id}.`, status: 404 });
    return game;
  }

  private async start(request: NewGameRequest, humanSide: Side, custom: unknown): Promise<MoveResult<unknown, unknown>> {
    const module = moduleFor(request.type);
    let state: unknown;
    try {
      state = custom == null ? module.engine.initialState() : module.engine.normalize(custom);
    } catch (error) {
      throw badRequest(error instanceof Error ? error.message : 'Invalid state.');
    }
    const now = Date.now();
    const game: StoredGame = {
      id: newId(),
      type: request.type,
      mode: request.mode,
      difficulty: request.difficulty,
      humanSide,
      version: 0,
      status: 'IN_PROGRESS',
      winner: null,
      resultReason: null,
      points: null,
      state,
      history: [],
      createdAt: now,
      updatedAt: now,
    };
    const before = state;
    const events: GameEvent<unknown, unknown>[] = [];
    state = await this.letComputerPlay(module, game, state, events);
    return this.persist(module, game, before, state, events);
  }

  /** In games against the computer, plays computer moves until it is the human's turn again. */
  private async letComputerPlay(
    module: GameModule,
    game: StoredGame,
    state: unknown,
    events: GameEvent<unknown, unknown>[],
  ): Promise<unknown> {
    const { engine } = module;
    while (game.mode === 'VS_AI' && !engine.outcome(state) && engine.sideToMove(state) !== game.humanSide) {
      const move = await this.chooseMove(game.type, state, game.difficulty, AI_BUDGET_MS);
      state = this.applyAndRecord(module, game, state, move, events);
    }
    return state;
  }

  private applyAndRecord(
    module: GameModule,
    game: StoredGame,
    state: unknown,
    move: unknown,
    events: GameEvent<unknown, unknown>[],
  ): unknown {
    const { engine } = module;
    const mover = engine.sideToMove(state);
    let next: unknown;
    try {
      next = engine.apply(state, move, this.rng);
    } catch (error) {
      if (error instanceof IllegalMoveError) throw illegal(error.message);
      throw illegal('The move could not be read.');
    }
    const recorded = engine.recorded(state, move, next);
    const actor = actorOf(game.mode, mover, game.humanSide);
    const ply = game.history.length;
    const notation = engine.notation(recorded);
    game.history.push({ ply, side: mover, actor, move: recorded, notation });
    events.push({ ply, side: mover, actor, move: recorded, notation, state: next });
    return next;
  }

  private persist(
    module: GameModule,
    game: StoredGame,
    before: unknown,
    state: unknown,
    events: GameEvent<unknown, unknown>[],
  ): MoveResult<unknown, unknown> {
    game.state = state;
    game.updatedAt = Date.now();
    const outcome = module.engine.outcome(state);
    if (outcome) {
      game.status = 'FINISHED';
      game.winner = outcome.winner;
      game.resultReason = outcome.reason;
      game.points = outcome.points;
    }
    this.store.save(game);
    if (outcome) this.store.tally(game);
    return { game: this.view(module, game, state), before, events };
  }

  private view(module: GameModule, game: StoredGame, state: unknown): GameView<unknown, unknown> {
    const { engine } = module;
    const outcome = engine.outcome(state);
    const toMove = engine.sideToMove(state);
    const humansTurn = !outcome && (game.mode === 'LOCAL' || toMove === game.humanSide);
    return {
      id: game.id,
      type: game.type,
      mode: game.mode,
      difficulty: game.difficulty,
      humanSide: game.humanSide,
      version: game.version,
      status: outcome ? 'FINISHED' : 'IN_PROGRESS',
      sideToMove: toMove,
      state,
      legalMoves: humansTurn ? engine.clientMoves(state) : [],
      moveGraph: humansTurn ? engine.moveGraph(state) : null,
      outcome,
      lastMove: game.history.length ? game.history[game.history.length - 1] : null,
      history: game.history,
    };
  }
}

export const referee = new Referee(new GameStore(), chooseInWorker);

/*
 * The full project's tests start games from custom positions through a dev-only endpoint. Here the
 * same hook is on window, so the end-to-end tests can begin one move from a win.
 */
declare global {
  interface Window {
    __threeClassics?: {
      createFromState: (request: NewGameRequest, state: unknown) => Promise<MoveResult<unknown, unknown>>;
    };
  }
}
if (typeof window !== 'undefined') {
  window.__threeClassics = {
    createFromState: (request, state) => referee.createFromState(request, state).then((r) => JSON.parse(JSON.stringify(r))),
  };
}
