import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, api } from '../../api/client';
import type { Actor, Difficulty, GameEvent, GameMode, GameType, GameView, MoveResult, Side } from '../../api/types';
import { readJson, writeJson } from '../../app/storage';
import { useToast } from '../../components/Toast';

export interface Prefs {
  mode: GameMode;
  difficulty: Difficulty;
  /** The human's seat against the computer. */
  humanSide: Side;
}

/** What the board draws right now. It trails the server state while events animate. */
export interface Shown<S, M> {
  state: S;
  /** The move that produced this state, if the board should animate it. */
  move: M | null;
  side: Side | null;
  animate: boolean;
  /** Changes on every update so boards can restart animations. */
  seq: number;
}

export interface GameSession<S, M> {
  game: GameView<S, M> | null;
  shown: Shown<S, M> | null;
  prefs: Prefs;
  /** A request is in flight or events are still animating. */
  busy: boolean;
  /** The computer is choosing its move. */
  thinking: boolean;
  /** The human may pick a move now. */
  canMove: boolean;
  /** The human has made at least one move in an unfinished game. */
  hasProgress: boolean;
  /**
   * Plays a move. If given, `preview` is drawn immediately while the server confirms. Set
   * `awaitsReply: false` for moves that don't hand the turn over, such as rolling the dice.
   */
  play: (move: M, preview?: S, options?: { awaitsReply?: boolean }) => void;
  /** Starts a new game with changed preferences, or a rematch of the current one. */
  restart: (changes?: Partial<Prefs>, options?: { rematch?: boolean }) => void;
}

interface SessionOptions<S, M> {
  type: GameType;
  defaults?: Partial<Prefs>;
  /** How long the board takes to animate one event, in ms. */
  eventDuration: (event: GameEvent<S, M>) => number;
  /** Called as each event is shown, e.g. to announce a passed turn. */
  onEvent?: (event: GameEvent<S, M>) => void;
}

/** The computer's reply is shown no sooner than this after the human moves, so it feels natural. */
const MIN_AI_DELAY_MS = 500;
const HUMAN_ACTORS: Actor[] = ['HUMAN', 'P1', 'P2'];

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const gameKey = (type: GameType) => `tc.game.${type}`;
const prefsKey = (type: GameType) => `tc.prefs.${type}`;

export function activeGameId(type: GameType): string | null {
  return readJson<string | null>(gameKey(type), null);
}

export function useGameSession<S, M>({ type, defaults, eventDuration, onEvent }: SessionOptions<S, M>): GameSession<S, M> {
  const toast = useToast();
  const [game, setGame] = useState<GameView<S, M> | null>(null);
  const [shown, setShown] = useState<Shown<S, M> | null>(null);
  const [busy, setBusy] = useState(true);
  const [thinking, setThinking] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(() => ({
    mode: 'VS_AI',
    difficulty: 'MEDIUM',
    humanSide: 'P1',
    ...defaults,
    ...readJson<Partial<Prefs>>(prefsKey(type), {}),
  }));

  // Every new request bumps the run id; stale playbacks notice and stop.
  const runId = useRef(0);
  const seq = useRef(0);
  const gameRef = useRef<GameView<S, M> | null>(null);
  const durationRef = useRef(eventDuration);
  durationRef.current = eventDuration;
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const show = useCallback((state: S, move: M | null, side: Side | null, animate: boolean) => {
    seq.current += 1;
    setShown({ state, move, side, animate, seq: seq.current });
  }, []);

  const adopt = useCallback(
    (view: GameView<S, M>) => {
      gameRef.current = view;
      setGame(view);
      writeJson(gameKey(type), view.id);
      const next = { mode: view.mode, difficulty: view.difficulty, humanSide: view.humanSide };
      setPrefs(next);
      writeJson(prefsKey(type), next);
    },
    [type],
  );

  /** Animates the events of a response one by one, then settles on the server's game. */
  const playback = useCallback(
    async (result: MoveResult<S, M>, run: number, startedAt: number, previewed: boolean) => {
      let events = result.events;
      if (previewed && events.length > 0 && HUMAN_ACTORS.includes(events[0].actor)) {
        // Already on screen from the preview; take the server's version without replaying it.
        show(events[0].state, events[0].move, events[0].side, false);
        onEventRef.current?.(events[0]);
        events = events.slice(1);
      } else if (!previewed && events.length > 0) {
        show(result.before, null, null, false);
      }

      let firstComputerMove = true;
      for (const event of events) {
        if (event.actor === 'AI' && firstComputerMove) {
          firstComputerMove = false;
          setThinking(true);
          await sleep(Math.max(0, startedAt + MIN_AI_DELAY_MS - performance.now()));
          if (run !== runId.current) return;
          setThinking(false);
        }
        show(event.state, event.move, event.side, true);
        onEventRef.current?.(event);
        await sleep(durationRef.current(event));
        if (run !== runId.current) return;
      }

      setThinking(false);
      adopt(result.game);
      if (events.length === 0 && !previewed) show(result.game.state, null, null, false);
      setBusy(false);
    },
    [adopt, show],
  );

  const resync = useCallback(
    async (message: string) => {
      toast.show(message);
      const current = gameRef.current;
      if (!current) return;
      try {
        const fresh = await api.getGame<S, M>(current.id);
        adopt(fresh);
        show(fresh.state, null, null, false);
      } catch {
        show(current.state, null, null, false);
      }
      setThinking(false);
      setBusy(false);
    },
    [adopt, show, toast],
  );

  const start = useCallback(
    async (next: Prefs, rematchOf?: string) => {
      const run = ++runId.current;
      setBusy(true);
      setThinking(false);
      writeJson(prefsKey(type), next);
      setPrefs(next);
      try {
        const result = await api.createGame<S, M>({
          type,
          mode: next.mode,
          difficulty: next.difficulty,
          humanSide: rematchOf ? undefined : next.humanSide,
          rematchOf,
        });
        if (run !== runId.current) return;
        gameRef.current = result.game;
        setGame({ ...result.game, legalMoves: [] });
        show(result.before, null, null, false);
        await playback(result, run, performance.now(), false);
      } catch {
        if (run !== runId.current) return;
        toast.show("Couldn't start a game. Try reloading the page.");
        setBusy(false);
      }
    },
    [playback, show, toast, type],
  );

  // Resume the stored game after a refresh, or start a new one.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const id = activeGameId(type);
      if (id) {
        try {
          const view = await api.getGame<S, M>(id);
          if (cancelled) return;
          if (view.status === 'IN_PROGRESS') {
            adopt(view);
            show(view.state, null, null, false);
            setBusy(false);
            return;
          }
        } catch {
          // Missing or unreachable: fall through to a new game.
        }
      }
      if (!cancelled) await start(readJson<Prefs>(prefsKey(type), prefs));
    })();
    return () => {
      cancelled = true;
    };
    // Runs once per mount; later changes go through restart().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const play = useCallback(
    (move: M, preview?: S, options: { awaitsReply?: boolean } = {}) => {
      const current = gameRef.current;
      if (!current || busy) return;
      const run = ++runId.current;
      const startedAt = performance.now();
      setBusy(true);
      setGame({ ...current, legalMoves: [] });
      if (preview) show(preview, move, current.sideToMove, true);
      if (current.mode === 'VS_AI' && options.awaitsReply !== false) setThinking(true);

      api
        .move<S, M>(current.id, current.version, move)
        .then((result) => {
          if (run !== runId.current) return;
          // Let the human's own move land before the computer answers.
          const humanAnimation = preview ? durationRef.current(result.events[0]) : 0;
          return playback(result, run, startedAt + Math.max(0, humanAnimation - MIN_AI_DELAY_MS + 150), Boolean(preview));
        })
        .catch((error: unknown) => {
          if (run !== runId.current) return;
          if (error instanceof ApiError && error.isStale) {
            void resync('This game changed elsewhere, so it was refreshed.');
          } else if (error instanceof ApiError) {
            void resync(error.message);
          } else {
            void resync('Something went wrong, so the game was refreshed.');
          }
        });
    },
    [busy, playback, resync, show],
  );

  const restart = useCallback(
    (changes: Partial<Prefs> = {}, options: { rematch?: boolean } = {}) => {
      const next = { ...prefs, ...changes };
      void start(next, options.rematch && gameRef.current ? gameRef.current.id : undefined);
    },
    [prefs, start],
  );

  const canMove = Boolean(game && game.status === 'IN_PROGRESS' && !busy && game.legalMoves.length > 0);
  const hasProgress = Boolean(
    game && game.status === 'IN_PROGRESS' && game.history.some((entry) => HUMAN_ACTORS.includes(entry.actor)),
  );

  return { game, shown, prefs, busy, thinking, canMove, hasProgress, play, restart };
}
