// Mirrors the Spring Boot DTOs in backend/src/main/java/com/threeclassics/service.

export type GameType = 'CONNECT_FOUR' | 'CHECKERS' | 'BACKGAMMON';
export type GameMode = 'VS_AI' | 'LOCAL';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type Side = 'P1' | 'P2';
export type Actor = 'HUMAN' | 'AI' | 'P1' | 'P2';
export type GameStatus = 'IN_PROGRESS' | 'FINISHED';

export interface Outcome {
  winner: Side | null;
  reason: string;
  points: number;
  draw: boolean;
}

export interface HistoryEntry<M> {
  ply: number;
  side: Side;
  actor: Actor;
  move: M;
  notation: string;
}

export interface GameView<S, M> {
  id: string;
  type: GameType;
  mode: GameMode;
  difficulty: Difficulty;
  humanSide: Side;
  version: number;
  status: GameStatus;
  sideToMove: Side;
  state: S;
  legalMoves: M[];
  /** For moves built step by step (backgammon turns), the legal steps as a graph. */
  moveGraph: unknown;
  outcome: Outcome | null;
  lastMove: HistoryEntry<M> | null;
  history: HistoryEntry<M>[];
}

export interface GameEvent<S, M> {
  ply: number;
  side: Side;
  actor: Actor;
  move: M;
  notation: string;
  state: S;
}

export interface MoveResult<S, M> {
  game: GameView<S, M>;
  /** The state before the first event. */
  before: S;
  events: GameEvent<S, M>[];
}

export interface NewGameRequest {
  type: GameType;
  mode: GameMode;
  difficulty: Difficulty;
  humanSide?: Side;
  rematchOf?: string;
}

export interface StatsEntry {
  type: GameType;
  difficulty: Difficulty;
  wins: number;
  losses: number;
  draws: number;
}

export interface Problem {
  title?: string;
  detail?: string;
  status?: number;
}
