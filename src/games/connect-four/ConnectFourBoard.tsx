import { forwardRef, useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react';
import type { Side } from '../../api/types';
import type { Shown } from '../shared/useGameSession';
import {
  CELL,
  COLUMNS,
  DISC_R,
  FRAME,
  HOLE_R,
  PREVIEW,
  PREVIEW_Y,
  ROWS,
  VIEW_H,
  VIEW_W,
  cellCenter,
  columnX,
  dropDuration,
} from './geometry';
import type { ConnectFourMove, ConnectFourState } from './types';
import styles from './ConnectFourBoard.module.css';

interface ConnectFourBoardProps {
  shown: Shown<ConnectFourState, ConnectFourMove>;
  /** Columns the human may drop into now; empty while waiting. */
  legalColumns: number[];
  onDrop: (column: number) => void;
}

/** The frame with a round hole per cell, drawn as one even-odd path. */
const FRAME_PATH = (() => {
  const top = PREVIEW;
  const w = VIEW_W;
  const h = VIEW_H - PREVIEW;
  const r = 18;
  let d = `M${r} ${top} H${w - r} A${r} ${r} 0 0 1 ${w} ${top + r} V${top + h - r} A${r} ${r} 0 0 1 ${w - r} ${top + h} H${r} A${r} ${r} 0 0 1 0 ${top + h - r} V${top + r} A${r} ${r} 0 0 1 ${r} ${top} Z`;
  for (let column = 0; column < COLUMNS; column++) {
    for (let row = 0; row < ROWS; row++) {
      const { x, y } = cellCenter(column, row);
      d += ` M${x - HOLE_R} ${y} a${HOLE_R} ${HOLE_R} 0 1 0 ${2 * HOLE_R} 0 a${HOLE_R} ${HOLE_R} 0 1 0 ${-2 * HOLE_R} 0 Z`;
    }
  }
  return d;
})();

export const ConnectFourBoard = forwardRef<SVGSVGElement, ConnectFourBoardProps>(function ConnectFourBoard(
  { shown, legalColumns, onDrop },
  ref,
) {
  const { state } = shown;
  const [hover, setHover] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [rovingColumn, setRovingColumn] = useState(3);
  const [shake, setShake] = useState<{ column: number; key: number } | null>(null);

  const canMove = legalColumns.length > 0;
  const previewColumn = canMove ? (hover ?? focused) : null;
  const winning = useMemo(
    () => new Set(state.winningLines.flatMap((line) => line.cells.map((cell) => `${cell.column}-${cell.row}`))),
    [state.winningLines],
  );
  const dropping = shown.animate && shown.move && state.lastDrop ? state.lastDrop : null;

  function attempt(column: number) {
    if (!canMove) return;
    if (legalColumns.includes(column)) {
      onDrop(column);
    } else {
      setShake({ column, key: Date.now() });
    }
  }

  function onKeyDown(event: KeyboardEvent, column: number) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const next = (column + (event.key === 'ArrowRight' ? 1 : -1) + COLUMNS) % COLUMNS;
      setRovingColumn(next);
      (event.currentTarget.parentNode?.children[next] as SVGElement | undefined)?.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      attempt(column);
    }
  }

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={styles.board}
      tabIndex={-1}
      role="group"
      aria-label="Connect Four board"
      onPointerLeave={() => setHover(null)}
    >
      <defs>
        <filter id="c4-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="14" stdDeviation="16" floodColor="#000" floodOpacity="0.35" />
        </filter>
        <radialGradient id="c4-hole" cx="50%" cy="38%" r="60%">
          <stop offset="0.7" stopColor="var(--c4-hole)" />
          <stop offset="1" stopColor="#021820" />
        </radialGradient>
      </defs>

      {/* The frame's surface and shadow, hole backs, discs, then the frame on top so falling discs pass behind it. */}
      <rect x={0} y={PREVIEW} width={VIEW_W} height={VIEW_H - PREVIEW} rx={18} className={styles.frame} filter="url(#c4-shadow)" />
      <g>
        {Array.from({ length: COLUMNS * ROWS }, (_, i) => {
          const { x, y } = cellCenter(i % COLUMNS, Math.floor(i / COLUMNS));
          return <circle key={i} cx={x} cy={y} r={HOLE_R} fill="url(#c4-hole)" data-cell />;
        })}
      </g>

      <g>
        {state.columns.flatMap((discs, column) =>
          discs.map((side, row) => {
            const { x, y } = cellCenter(column, row);
            const isDropping = dropping?.column === column && dropping.row === row;
            const key = `${column}-${row}`;
            const dim = winning.size > 0 && !winning.has(key);
            return (
              <g
                key={isDropping ? `${key}-${shown.seq}` : key}
                className={[styles.disc, isDropping ? styles.dropping : '', dim ? styles.dim : ''].join(' ')}
                style={
                  {
                    transform: `translate(${x}px, ${y}px)`,
                    '--x': `${x}px`,
                    '--y': `${y}px`,
                    '--from-y': `${PREVIEW_Y}px`,
                    '--drop-ms': `${dropDuration(row)}ms`,
                  } as CSSProperties
                }
              >
                <Disc side={side} />
              </g>
            );
          }),
        )}
      </g>

      <path d={FRAME_PATH} fillRule="evenodd" className={styles.frame} />
      <g className={styles.rims}>
        {Array.from({ length: COLUMNS * ROWS }, (_, i) => {
          const { x, y } = cellCenter(i % COLUMNS, Math.floor(i / COLUMNS));
          return <circle key={i} cx={x} cy={y} r={HOLE_R} />;
        })}
      </g>

      {state.lastDrop && winning.size === 0 && (
        <circle
          className={styles.last}
          cx={cellCenter(state.lastDrop.column, state.lastDrop.row).x}
          cy={cellCenter(state.lastDrop.column, state.lastDrop.row).y}
          r={HOLE_R + 3}
        />
      )}
      {[...winning].map((key) => {
        const [column, row] = key.split('-').map(Number);
        const { x, y } = cellCenter(column, row);
        return <circle key={key} className={styles.win} cx={x} cy={y} r={HOLE_R - 1} />;
      })}

      {previewColumn !== null && legalColumns.includes(previewColumn) && (
        <g className={styles.preview} style={{ transform: `translate(${columnX(previewColumn)}px, ${PREVIEW_Y}px)` }}>
          <Disc side={state.sideToMove} />
        </g>
      )}
      {shake && (
        <g
          key={shake.key}
          className={styles.shake}
          style={{ transform: `translate(${columnX(shake.column)}px, ${PREVIEW_Y}px)` }}
          onAnimationEnd={() => setShake(null)}
        >
          <Disc side={state.sideToMove} />
        </g>
      )}

      <g>
        {Array.from({ length: COLUMNS }, (_, column) => {
          const count = state.columns[column].length;
          const full = count === ROWS;
          return (
            <g
              key={column}
              role="button"
              tabIndex={column === rovingColumn ? 0 : -1}
              aria-label={`Column ${column + 1}, ${count} ${count === 1 ? 'disc' : 'discs'}${full ? ', full' : ''}`}
              aria-disabled={!canMove || full}
              className={styles.column}
              onPointerEnter={() => setHover(column)}
              onClick={() => attempt(column)}
              onKeyDown={(event) => onKeyDown(event, column)}
              onFocus={(event) => {
                setRovingColumn(column);
                // Only keyboard focus previews a disc; a mouse click shouldn't leave one behind.
                if (event.currentTarget.matches(':focus-visible')) setFocused(column);
              }}
              onBlur={() => setFocused(null)}
            >
              <rect x={FRAME + column * CELL} y={0} width={CELL} height={VIEW_H} fill="transparent" />
              <rect
                className={styles.focusRing}
                x={FRAME + column * CELL + 4}
                y={PREVIEW + 6}
                width={CELL - 8}
                height={ROWS * CELL + 2 * FRAME - 12}
                rx={12}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
});

/** A disc centred on the origin. Gold carries a centre dot so the sides differ by shape, too. */
export function Disc({ side }: { side: Side }) {
  const coral = side === 'P1';
  return (
    <>
      <circle r={DISC_R} fill={coral ? 'var(--c4-coral)' : 'var(--c4-gold)'} />
      <circle r={DISC_R * 0.72} fill="none" stroke={coral ? 'var(--c4-coral-ring)' : 'var(--c4-gold-ring)'} strokeWidth={4} />
      <circle r={DISC_R * 0.72 - 3} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={1.5} />
      {!coral && <circle r={DISC_R * 0.16} fill="var(--c4-gold-ring)" />}
    </>
  );
}

/** A small disc for turn indicators and the move list. */
export function DiscSwatch({ side }: { side: Side }) {
  return (
    <svg viewBox="-44 -44 88 88" aria-hidden="true">
      <Disc side={side} />
    </svg>
  );
}
