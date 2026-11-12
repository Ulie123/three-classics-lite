import { useEffect, useState, type ComponentType, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, House, RotateCcw } from 'lucide-react';
import type { GameMode, Side } from '../../api/types';
import { useSettings } from '../../app/settings';
import { IconButton } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Drawer } from '../../components/Drawer';
import { SegmentedControl, type Segment } from '../../components/SegmentedControl';
import { SettingsMenu } from '../../components/SettingsMenu';
import { TopBar } from '../../components/TopBar';
import type { SceneProps } from '../../themes/scene/SceneFrame';
import { MoveList } from './MoveList';
import { DIFFICULTIES } from './options';
import { ResultModal, type FlourishKind } from './ResultModal';
import { resultTitle } from './result';
import type { GameSession, Prefs } from './useGameSession';
import styles from './GameShell.module.css';

const MODES: Segment<GameMode>[] = [
  { value: 'VS_AI', label: 'Computer' },
  { value: 'LOCAL', label: '2 Players' },
];

interface GameShellProps<S, M> {
  theme: 'ocean' | 'winter' | 'desert';
  title: string;
  Scene: ComponentType<SceneProps>;
  session: GameSession<S, M>;
  /** Board width ÷ height, from its viewBox. */
  aspect: number;
  /** Draw the soft shadow around the board box. Off when the board draws its own surface. */
  boardShadow?: boolean;
  board: ReactNode;
  boardRef: RefObject<SVGSVGElement | null>;
  sideName: (side: Side) => string;
  swatch: (side: Side) => ReactNode;
  /** Seat choice offered before a game against the computer (omitted for backgammon). */
  sideChoice?: { label: string; options: Segment<Side>[]; describe: (side: Side) => string };
  /** Game-specific panel content: players, captures, pip counts. */
  panel?: ReactNode;
  /** A one-line game-specific message, e.g. "No legal moves — turn passes". */
  note?: string | null;
  /** Controls that sit under the board with reserved height, e.g. dice and Confirm. */
  belowBoard?: ReactNode;
  rules: ReactNode;
  flourish: FlourishKind;
}

/** Shared layout for every game: top bar, centred board, side panel, rules, dialogs and result. */
export function GameShell<S, M>(props: GameShellProps<S, M>) {
  const { theme, title, Scene, session, aspect, boardShadow = true, board, boardRef, sideName, swatch, sideChoice, panel, note, belowBoard, rules, flourish } = props;
  const { game, prefs, thinking, busy, hasProgress, restart } = session;
  const { ambientMotion } = useSettings();
  const [rulesOpen, setRulesOpen] = useState(false);
  const [pending, setPending] = useState<{ title: string; confirm: string; changes: Partial<Prefs> } | null>(null);
  const [resultOpen, setResultOpen] = useState(false);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);

  useEffect(() => {
    document.body.dataset.theme = theme;
    document.title = `${title} · Three Classics`;
    return () => {
      delete document.body.dataset.theme;
    };
  }, [theme, title]);

  // Let the player see the final move and winning line for a moment before the result appears.
  const finishedId = game?.status === 'FINISHED' && !busy ? game.id : null;
  useEffect(() => {
    setResultOpen(false);
    if (!finishedId) return;
    const timer = window.setTimeout(() => setResultOpen(true), 800);
    return () => window.clearTimeout(timer);
  }, [finishedId]);

  function change(changes: Partial<Prefs>, confirmTitle: string) {
    if (hasProgress) {
      setPending({ title: confirmTitle, confirm: 'Restart', changes });
    } else {
      restart(changes);
    }
  }

  function onRestart() {
    if (hasProgress) setPending({ title: 'Restart this game?', confirm: 'Restart', changes: {} });
    else restart();
  }

  const difficultyControl = (size: 'sm' | 'md') => (
    <SegmentedControl
      label="Difficulty"
      size={size}
      options={DIFFICULTIES}
      value={prefs.difficulty}
      disabled={prefs.mode === 'LOCAL'}
      onChange={(difficulty) =>
        difficulty !== prefs.difficulty &&
        change({ difficulty }, `Restart on ${DIFFICULTIES.find((d) => d.value === difficulty)?.label}?`)
      }
    />
  );

  const turnText = (() => {
    if (!game) return 'Setting up…';
    if (game.status === 'FINISHED' && !busy) return resultTitle(game, sideName);
    if (game.mode === 'LOCAL') return `${sideName(game.sideToMove)} to move`;
    return game.sideToMove === game.humanSide && !thinking ? 'Your turn' : "Computer's turn";
  })();
  const statusText =
    note ?? (thinking ? 'Computer is thinking…' : game?.status === 'FINISHED' && !busy ? game.outcome?.reason : '') ?? '';

  return (
    <div className={styles.page}>
      <Scene animate={ambientMotion} scrim />
      <TopBar
        left={
          <Link to="/" className={styles.home}>
            <House strokeWidth={1.75} aria-hidden="true" />
            <span className={styles.homeLabel}>Home</span>
          </Link>
        }
        title={title}
        right={
          <>
            <div className={styles.topDifficulty}>{difficultyControl('sm')}</div>
            <IconButton label="Restart" icon={<RotateCcw strokeWidth={1.75} />} onClick={onRestart} disabled={!game} />
            <IconButton label="Rules" icon={<BookOpen strokeWidth={1.75} />} onClick={() => setRulesOpen(true)} />
            <SettingsMenu />
          </>
        }
      />

      <main className={styles.main}>
        <section
          className={styles.boardColumn}
          style={{ '--aspect': aspect } as CSSProperties}
          aria-label={`${title} board`}
          data-testid="board-column"
        >
          <div className={styles.stage}>
            <div className={[styles.board, boardShadow ? styles.shadowed : ''].join(' ')} data-testid="board">
              {board}
            </div>
            {belowBoard && <div className={styles.below}>{belowBoard}</div>}
          </div>
          {finishedId && dismissedFor === finishedId && !resultOpen && (
            <button type="button" className={styles.pill} onClick={() => setResultOpen(true)}>
              Show result
            </button>
          )}
        </section>

        <aside className={styles.panel} aria-label="Game panel" data-testid="panel">
          <div className={styles.card}>
            <div className={styles.turn} aria-live="polite">
              <span className={styles.swatch}>{game && swatch(game.status === 'FINISHED' && game.outcome?.winner ? game.outcome.winner : game.sideToMove)}</span>
              <span className={styles.turnText}>{turnText}</span>
            </div>
            <p className={styles.status}>{statusText}</p>
          </div>

          {panel && <div className={styles.card}>{panel}</div>}

          <div className={[styles.card, styles.settings].join(' ')}>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Opponent</span>
              <SegmentedControl
                label="Opponent"
                options={MODES}
                value={prefs.mode}
                onChange={(mode) =>
                  mode !== prefs.mode && change({ mode }, mode === 'LOCAL' ? 'Restart as a two-player game?' : 'Restart against the computer?')
                }
              />
            </div>
            {sideChoice && prefs.mode === 'VS_AI' && (
              <div className={styles.field}>
                <span className={styles.fieldLabel}>{sideChoice.label}</span>
                <SegmentedControl
                  label={sideChoice.label}
                  options={sideChoice.options}
                  value={prefs.humanSide}
                  onChange={(humanSide) =>
                    humanSide !== prefs.humanSide && change({ humanSide }, `Restart and ${sideChoice.describe(humanSide)}?`)
                  }
                />
              </div>
            )}
            <div className={[styles.field, styles.panelDifficulty].join(' ')}>
              <span className={styles.fieldLabel}>Difficulty</span>
              {difficultyControl('md')}
            </div>
          </div>

          <div className={[styles.card, styles.moves].join(' ')}>
            <h2 className={styles.cardTitle}>Moves</h2>
            <MoveList history={game?.history ?? []} swatch={swatch} />
          </div>
        </aside>
      </main>

      <ConfirmDialog
        open={pending !== null}
        title={pending?.title ?? ''}
        message="The current game will be lost."
        confirmLabel={pending?.confirm ?? 'Restart'}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          const changes = pending?.changes ?? {};
          setPending(null);
          restart(changes);
        }}
      />

      <Drawer open={rulesOpen} title={`How to play ${title}`} onClose={() => setRulesOpen(false)}>
        {rules}
      </Drawer>

      {game && (
        <ResultModal
          open={resultOpen}
          game={game}
          sideName={sideName}
          flourish={flourish}
          returnFocus={boardRef}
          onClose={() => {
            setDismissedFor(game.id);
            setResultOpen(false);
          }}
          onPlayAgain={(difficulty) => {
            setResultOpen(false);
            restart({ difficulty }, { rematch: true });
          }}
        />
      )}
    </div>
  );
}
