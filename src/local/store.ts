import type { Actor, Difficulty, GameMode, GameType, HistoryEntry, Side } from '../api/types';

/** One game as the full project's games and moves tables held it. */
export interface StoredGame {
  id: string;
  type: GameType;
  mode: GameMode;
  difficulty: Difficulty;
  humanSide: Side;
  version: number;
  status: 'IN_PROGRESS' | 'FINISHED';
  winner: Side | null;
  resultReason: string | null;
  points: number | null;
  state: unknown;
  history: HistoryEntry<unknown>[];
  createdAt: number;
  updatedAt: number;
}

export type Tally = { wins: number; losses: number; draws: number };

interface Saved {
  version: 1;
  games: Record<string, StoredGame>;
  /** Results of finished games against the computer, kept even after old games are pruned. */
  stats: Partial<Record<GameType, Partial<Record<Difficulty, Tally>>>>;
}

const KEY = 'tc.lite.games';
/** Finished games are only needed for rematches; keep a few. */
const KEEP_FINISHED = 20;
/** Abandoned games pile up as players restart; the active ones are always the most recent. */
const KEEP_IN_PROGRESS = 12;

export type { Actor };

/**
 * Saved games in localStorage, in place of the full project's PostgreSQL database. If storage is
 * blocked (private windows, strict settings) the games live in memory for the visit instead.
 */
export class GameStore {
  private memory: Saved | null = null;
  /** Whether the last write reached localStorage; if not, memory is the only copy. */
  private persistent = true;

  private read(): Saved {
    if (this.memory) return this.memory;
    let saved: Saved | null = null;
    try {
      const raw = window.localStorage.getItem(KEY);
      saved = raw ? (JSON.parse(raw) as Saved) : null;
    } catch {
      saved = null;
    }
    if (!saved || saved.version !== 1) saved = { version: 1, games: {}, stats: {} };
    this.memory = saved;
    return saved;
  }

  private write(saved: Saved): void {
    this.memory = saved;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(saved));
      this.persistent = true;
    } catch {
      // Storage unavailable or full: keep playing from memory.
      this.persistent = false;
    }
  }

  /** Re-reads storage, so changes made in another tab are seen. Memory-only games are kept. */
  refresh(): void {
    if (this.persistent) this.memory = null;
  }

  /** A copy: changes only count once the game is saved again. */
  find(id: string): StoredGame | null {
    const game = this.read().games[id];
    return game ? (JSON.parse(JSON.stringify(game)) as StoredGame) : null;
  }

  save(game: StoredGame): void {
    const saved = this.read();
    saved.games[game.id] = game;
    this.write(prune(saved));
  }

  /** Records a finished game against the computer in the win/loss table. */
  tally(game: StoredGame): void {
    if (game.mode !== 'VS_AI' || game.status !== 'FINISHED') return;
    const saved = this.read();
    const row = (saved.stats[game.type] ??= {});
    const tally = (row[game.difficulty] ??= { wins: 0, losses: 0, draws: 0 });
    if (game.winner === null) tally.draws++;
    else if (game.winner === game.humanSide) tally.wins++;
    else tally.losses++;
    this.write(saved);
  }

  stats(): Saved['stats'] {
    return this.read().stats;
  }
}

function prune(saved: Saved): Saved {
  const games = Object.values(saved.games).sort((a, b) => b.updatedAt - a.updatedAt);
  const keep = [
    ...games.filter((game) => game.status === 'IN_PROGRESS').slice(0, KEEP_IN_PROGRESS),
    ...games.filter((game) => game.status === 'FINISHED').slice(0, KEEP_FINISHED),
  ];
  return { ...saved, games: Object.fromEntries(keep.map((game) => [game.id, game])) };
}
