import { forwardRef, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Side } from '../../api/types';
import { matching, nextSteps } from '../shared/prefix';
import type { Shown } from '../shared/useGameSession';
import {
  CELL,
  HOP_MS,
  PIECE_R,
  SIZE,
  VIEW,
  describePiece,
  isKing,
  isPlayable,
  owner,
  squareAt,
  squareCenter,
  squareName,
  squareOrigin,
} from './geometry';
import type { CheckersMove, CheckersState } from './types';
import styles from './CheckersBoard.module.css';

interface CheckersBoardProps {
  shown: Shown<CheckersState, CheckersMove>;
  /** Draw from Light's side, so the human's pieces are always at the bottom. */
  flipped: boolean;
  /** The human's legal moves now; empty while waiting. */
  legal: CheckersMove[];
  /** Squares chosen so far in the move being built: the piece, then each landing square. */
  prefix: number[];
  onSquare: (square: number) => void;
  onCancel: () => void;
  shake: { square: number; key: number } | null;
}

const PLAYABLE = Array.from({ length: SIZE * SIZE }, (_, i) => i).filter(isPlayable);

export const CheckersBoard = forwardRef<SVGSVGElement, CheckersBoardProps>(function CheckersBoard(
  { shown, flipped, legal, prefix, onSquare, onCancel, shake },
  ref,
) {
  const { state } = shown;
  const [focusSquare, setFocusSquare] = useState(() => squareAt(SIZE - 1, 0, flipped));

  // Remember what was on screen before this update: captured pieces fade out from there, and a
  // move the human built step by step only animates its last hop.
  const rendered = useRef<{ seq: number; state: CheckersState; prefix: number[] } | null>(null);
  const transition = useRef<{ before: CheckersState | null; startHop: number }>({ before: null, startHop: 0 });
  if (rendered.current?.seq !== shown.seq) {
    const previous = rendered.current;
    const move = shown.move;
    const builtPrefix = previous && move && previous.prefix.length > 1 && previous.prefix.every((s, i) => move.path[i] === s);
    transition.current = { before: previous?.state ?? null, startHop: builtPrefix ? previous.prefix.length - 2 : 0 };
  }
  useEffect(() => {
    rendered.current = { seq: shown.seq, state: shown.state, prefix };
  });

  const paths = legal.map((move) => move.path);
  const targets = prefix.length > 0 ? nextSteps(paths, prefix) : [];
  const building = prefix.length > 0 ? matching(paths, prefix) : [];
  const capturing = legal.length > 0 && legal[0].captures.length > 0;
  const takenSoFar = new Set(
    prefix.length > 1 ? legal.find((m) => building.includes(m.path))?.captures.slice(0, prefix.length - 1) : [],
  );

  const animating = shown.animate && shown.move ? shown.move : null;
  const movingTo = animating ? animating.path[animating.path.length - 1] : -1;
  const before = transition.current.before;
  const crowned = Boolean(animating && before && !isKing(before.board[animating.path[0]]) && isKing(state.board[movingTo]));
  const hops = animating ? animating.path.length - 1 - transition.current.startHop : 0;

  const highlight = prefix.length === 0 && state.lastMove ? state.lastMove.path : [];
  const center = (square: number) => squareCenter(square, flipped);

  function onKeyDown(event: KeyboardEvent, square: number) {
    const row = Math.floor(square / SIZE);
    const column = square % SIZE;
    const screenRow = flipped ? SIZE - 1 - row : row;
    const screenColumn = flipped ? SIZE - 1 - column : column;
    const step: Record<string, [number, number]> = {
      ArrowLeft: [0, -2],
      ArrowRight: [0, 2],
      ArrowUp: [-1, screenColumn % 2 === 0 ? 1 : -1],
      ArrowDown: [1, screenColumn % 2 === 0 ? 1 : -1],
    };
    if (step[event.key]) {
      event.preventDefault();
      const r = screenRow + step[event.key][0];
      const c = screenColumn + step[event.key][1];
      if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return;
      const next = squareAt(r, c, flipped);
      setFocusSquare(next);
      (event.currentTarget.parentNode?.querySelector(`[data-square="${next}"]`) as SVGElement | null)?.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSquare(square);
    } else if (event.key === 'Escape') {
      onCancel();
    }
  }

  const selected = prefix.length > 0 ? prefix[0] : -1;

  return (
    <svg ref={ref} viewBox={`0 0 ${VIEW} ${VIEW}`} className={styles.board} tabIndex={-1}
      role="group" aria-label="Checkers board">
      <defs>
        <filter id="ck-lift" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="10" stdDeviation="7" floodColor="#000" floodOpacity="0.45" />
        </filter>
      </defs>

      <rect width={VIEW} height={VIEW} rx={12} className={styles.frame} />
      {Array.from({ length: SIZE * SIZE }, (_, square) => {
        const { x, y } = squareOrigin(square, flipped);
        const playable = isPlayable(square);
        return (
          <rect
            key={square}
            x={x}
            y={y}
            width={CELL}
            height={CELL}
            className={playable ? styles.dark : styles.light}
            data-cell={playable ? '' : undefined}
          />
        );
      })}

      {highlight.map((square) => {
        const { x, y } = squareOrigin(square, flipped);
        return <rect key={`h${square}`} x={x + 5} y={y + 5} width={CELL - 10} height={CELL - 10} rx={6} className={styles.last} />;
      })}

      {capturing && prefix.length === 0 &&
        [...new Set(paths.map((p) => p[0]))].map((square) => {
          const { x, y } = center(square);
          return <circle key={`c${square}`} cx={x} cy={y} r={PIECE_R + 7} className={styles.mustCapture} />;
        })}

      {/* Pieces that stay put. */}
      {Array.from(state.board).map((piece, square) => {
        if (piece === '.' || square === selected || square === movingTo) return null;
        const { x, y } = center(square);
        const isShaking = shake?.square === square;
        return (
          <g
            key={isShaking ? `p${square}-${shake.key}` : `p${square}`}
            className={[styles.piece, isShaking ? styles.shake : '', takenSoFar.has(square) ? styles.taken : ''].join(' ')}
            style={{ transform: `translate(${x}px, ${y}px)` }}
          >
            <Piece piece={piece} />
          </g>
        );
      })}

      {/* Pieces jumped by the move being animated shrink and fade as the mover passes. */}
      {animating &&
        before &&
        animating.captures.map((square, i) => {
          if (i < transition.current.startHop) return null;
          const { x, y } = center(square);
          return (
            <g
              key={`x${square}-${shown.seq}`}
              className={styles.captured}
              style={{ transform: `translate(${x}px, ${y}px)`, animationDelay: `${(i - transition.current.startHop) * HOP_MS + HOP_MS / 2}ms` }}
            >
              <Piece piece={before.board[square]} />
            </g>
          );
        })}

      {animating && (
        <MovingPiece
          key={`m${shown.seq}`}
          piece={state.board[movingTo]}
          crownedOnArrival={crowned}
          beforePiece={before?.board[animating.path[0]] ?? state.board[movingTo]}
          points={animating.path.slice(transition.current.startHop).map(center)}
          hops={hops}
        />
      )}

      {/* The piece being moved by the human, lifted, at the latest square chosen. */}
      {selected >= 0 && state.board[selected] !== '.' && (
        <g
          key="selected"
          className={[styles.piece, styles.selected, shake?.square === selected ? styles.shake : ''].join(' ')}
          style={{ transform: `translate(${center(prefix[prefix.length - 1]).x}px, ${center(prefix[prefix.length - 1]).y}px)` }}
        >
          <g className={styles.lift} filter="url(#ck-lift)">
            <Piece piece={state.board[selected]} />
          </g>
        </g>
      )}

      {targets.map((square) => {
        const { x, y } = center(square);
        return capturing ? (
          <circle key={`t${square}`} cx={x} cy={y} r={PIECE_R - 4} className={styles.targetRing} />
        ) : (
          <circle key={`t${square}`} cx={x} cy={y} r={13} className={styles.target} />
        );
      })}

      <g>
        {PLAYABLE.map((square) => {
          const { x, y } = squareOrigin(square, flipped);
          const piece = state.board[square];
          const isTarget = targets.includes(square);
          return (
            <g
              key={square}
              data-square={square}
              role="button"
              tabIndex={square === focusSquare ? 0 : -1}
              aria-label={`${squareName(square)}, ${describePiece(piece)}${isTarget ? ', move here' : ''}${square === selected ? ', selected' : ''}`}
              className={styles.hit}
              onClick={() => onSquare(square)}
              onKeyDown={(event) => onKeyDown(event, square)}
              onFocus={() => setFocusSquare(square)}
            >
              <rect x={x} y={y} width={CELL} height={CELL} fill="transparent" />
              <rect x={x + 3} y={y + 3} width={CELL - 6} height={CELL - 6} rx={8} className={styles.focusRing} />
            </g>
          );
        })}
      </g>
    </svg>
  );
});

function MovingPiece({
  piece,
  beforePiece,
  crownedOnArrival,
  points,
  hops,
}: {
  piece: string;
  beforePiece: string;
  crownedOnArrival: boolean;
  points: { x: number; y: number }[];
  hops: number;
}) {
  const [hop, setHop] = useState(0);
  useEffect(() => {
    if (hop >= hops) return;
    // Paint the start position first, then slide one hop at a time.
    const timer = window.setTimeout(() => setHop((h) => h + 1), hop === 0 ? 20 : HOP_MS);
    return () => window.clearTimeout(timer);
  }, [hop, hops]);

  const arrived = hop >= hops;
  const point = points[Math.min(hop, points.length - 1)];
  return (
    <g className={[styles.piece, styles.moving].join(' ')} style={{ transform: `translate(${point.x}px, ${point.y}px)` }}>
      <Piece piece={crownedOnArrival && !arrived ? beforePiece : piece} crownDrop={crownedOnArrival && arrived} />
      {crownedOnArrival && arrived && <Sparkle />}
    </g>
  );
}

/** A tiny frost sparkle when a man is crowned. */
function Sparkle() {
  return (
    <g className={styles.sparkle}>
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <line key={angle} x1={0} y1={-PIECE_R - 6} x2={0} y2={-PIECE_R - 16} transform={`rotate(${angle})`} />
      ))}
    </g>
  );
}

/** A piece centred on the origin. Kings are a stacked, double-height piece with a crown mark. */
export function Piece({ piece, crownDrop = false }: { piece: string; crownDrop?: boolean }) {
  const dark = owner(piece) === 'P1';
  const fill = dark ? 'var(--ck-dark-piece)' : 'var(--ck-light-piece)';
  const rim = dark ? 'var(--ck-dark-rim)' : 'var(--ck-light-rim)';
  const disc = (dy: number) => (
    <g transform={`translate(0 ${dy})`}>
      <circle r={PIECE_R} fill={fill} stroke={rim} strokeWidth={3} />
      <circle r={PIECE_R * 0.68} fill="none" stroke={rim} strokeOpacity={0.45} strokeWidth={2} />
    </g>
  );
  if (!isKing(piece)) {
    return (
      <>
        <circle r={PIECE_R} cy={5} fill="rgba(0,0,0,0.28)" />
        {disc(0)}
      </>
    );
  }
  return (
    <>
      <circle r={PIECE_R} cy={11} fill="rgba(0,0,0,0.28)" />
      {disc(6)}
      <g className={crownDrop ? styles.crownDrop : undefined}>
        {disc(-6)}
        <path
          d="M-14 2 L-16 -12 L-7 -5 L0 -15 L7 -5 L16 -12 L14 2 Z"
          transform="translate(0 -5)"
          fill={dark ? 'var(--ck-light-rim)' : 'var(--ck-dark)'}
        />
      </g>
    </>
  );
}

/** A small piece for the turn indicator and move list. */
export function PieceSwatch({ side, king = false }: { side: Side; king?: boolean }) {
  const piece = side === 'P1' ? (king ? 'D' : 'd') : king ? 'L' : 'l';
  return (
    <svg viewBox="-44 -50 88 96" aria-hidden="true">
      <Piece piece={piece} />
    </svg>
  );
}
