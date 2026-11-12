import { forwardRef, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Side } from '../../api/types';
import type { Shown } from '../shared/useGameSession';
import {
  BAR_W,
  BAR_X,
  FRAME,
  HALF_W,
  MAX_STACK,
  MID_GAP,
  OFF_SCALE,
  POINT_H,
  POINT_W,
  R,
  TRAY_W,
  TRAY_X,
  VIEW_H,
  VIEW_W,
  checkerOff,
  checkerOnBar,
  checkerOnPoint,
  columnX,
  pointSlot,
  toScreenPoint,
} from './geometry';
import { initialStacks, placed, replay, type Placed, type Stacks } from './stacks';
import { BAR, OFF, type BackgammonMove, type BackgammonState, type Step } from './types';
import styles from './BackgammonBoard.module.css';

export const STEP_MS = 380;

interface BackgammonBoardProps {
  shown: Shown<BackgammonState, BackgammonMove>;
  /** Steps the human has chosen so far this turn, in the mover's numbering. */
  building: Step[];
  /** Whose turn is being built (the steps' numbering). */
  mover: Side;
  /** Locations (mover's numbering) with a checker that can move next. */
  sources: number[];
  /** Where the selected checker can go (mover's numbering; 0 = off). */
  destinations: number[];
  selected: number | null;
  /** The most recent turn played, to mark where its checkers landed. */
  lastTurn: { side: Side; steps: Step[] } | null;
  onLocation: (location: number) => void;
  shake: { location: number; key: number } | null;
}

/** Locations in screen reading order for keyboard focus: the top row, then the bottom row. */
const FOCUS_ORDER = ['p13', 'p14', 'p15', 'p16', 'p17', 'p18', 'barP2', 'p19', 'p20', 'p21', 'p22', 'p23', 'p24', 'offP2',
  'p12', 'p11', 'p10', 'p9', 'p8', 'p7', 'barP1', 'p6', 'p5', 'p4', 'p3', 'p2', 'p1', 'offP1'];

function position(checker: Placed): { x: number; y: number; scale: number } {
  if (checker.key.startsWith('p')) return { ...checkerOnPoint(Number(checker.key.slice(1)), checker.index), scale: 1 };
  if (checker.key.startsWith('bar')) return { ...checkerOnBar(checker.side, checker.index), scale: 1 };
  return { ...checkerOff(checker.side, checker.index), scale: OFF_SCALE };
}

export const BackgammonBoard = forwardRef<SVGSVGElement, BackgammonBoardProps>(function BackgammonBoard(
  { shown, building, mover, sources, destinations, selected, lastTurn, onLocation, shake },
  ref,
) {
  // The position before this update: a computer turn animates step by step from there.
  const rendered = useRef<{ seq: number; state: BackgammonState; building: Step[] } | null>(null);
  const transition = useRef<{ before: BackgammonState | null; alreadyShown: number }>({ before: null, alreadyShown: 0 });
  if (rendered.current?.seq !== shown.seq) {
    const previous = rendered.current;
    const steps = shown.move?.kind === 'TURN' ? shown.move.steps : [];
    const sameAsBuilt =
      previous !== null && previous.building.length === steps.length && previous.building.every((s, i) => s.from === steps[i].from && s.to === steps[i].to);
    transition.current = { before: previous?.state ?? null, alreadyShown: sameAsBuilt ? steps.length : 0 };
  }
  useEffect(() => {
    rendered.current = { seq: shown.seq, state: shown.state, building };
  });

  const animating = shown.animate && shown.move?.kind === 'TURN' && transition.current.before ? shown.move : null;
  const [progress, setProgress] = useState({ seq: -1, played: 0 });
  const played = progress.seq === shown.seq ? progress.played : transition.current.alreadyShown;
  useEffect(() => {
    if (!animating || played >= animating.steps.length) return;
    const timer = window.setTimeout(
      () => setProgress({ seq: shown.seq, played: played + 1 }),
      played === transition.current.alreadyShown ? 30 : STEP_MS,
    );
    return () => window.clearTimeout(timer);
  }, [animating, played, shown.seq]);

  // Base position plus the steps since then decide where every checker is drawn.
  let stacks: Stacks;
  if (animating) {
    stacks = initialStacks(transition.current.before!);
    const turnSide = shown.side ?? shown.state.sideToMove;
    for (const step of animating.steps.slice(0, played)) stacks = replay(stacks, turnSide, step);
  } else {
    stacks = initialStacks(shown.state);
    for (const step of building) stacks = replay(stacks, mover, step);
  }
  const checkers = placed(stacks);

  const screenKey = (location: number) => (location === BAR ? `bar${mover}` : location === OFF ? `off${mover}` : `p${toScreenPoint(location, mover)}`);
  const sourceKeys = new Set(sources.map(screenKey));
  const destinationKeys = new Set(destinations.map(screenKey));
  const selectedKey = selected === null ? null : screenKey(selected);
  const shakeKey = shake ? screenKey(shake.location) : null;

  const showLast = !animating && building.length === 0 && lastTurn;
  const lastTo = new Set(
    showLast ? lastTurn.steps.filter((s) => s.to !== OFF).map((s) => `p${toScreenPoint(s.to, lastTurn.side)}`) : [],
  );

  const [focusKey, setFocusKey] = useState('p1');

  /** The mover's location for a screen key, or -1 for the other side's bar or tray. */
  function locationOf(key: string): number {
    if (key.startsWith('bar')) return key === `bar${mover}` ? BAR : -1;
    if (key.startsWith('off')) return key === `off${mover}` ? OFF : -1;
    const point = Number(key.slice(1));
    return mover === 'P1' ? point : 25 - point;
  }

  function onKeyDown(event: KeyboardEvent, key: string) {
    const index = FOCUS_ORDER.indexOf(key);
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -14, ArrowDown: 14 };
    if (event.key in moves) {
      event.preventDefault();
      const next = FOCUS_ORDER[(index + moves[event.key] + FOCUS_ORDER.length) % FOCUS_ORDER.length];
      setFocusKey(next);
      (event.currentTarget.parentNode?.querySelector(`[data-location="${next}"]`) as SVGElement | null)?.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onLocation(locationOf(key));
    }
  }

  function describe(key: string): string {
    const here = stacks[key] ?? [];
    const ivory = here.filter((id) => id.startsWith('i')).length;
    const obsidian = here.length - ivory;
    const contents = ivory ? `${ivory} ivory` : obsidian ? `${obsidian} obsidian` : 'empty';
    const name = key.startsWith('bar') ? 'Bar' : key.startsWith('off') ? `${key.endsWith('P1') ? 'Ivory' : 'Obsidian'} borne off` : `Point ${key.slice(1)}`;
    const checkersWord = ivory + obsidian === 1 ? 'checker' : 'checkers';
    const tail = destinationKeys.has(key)
      ? ', move here'
      : key === selectedKey
        ? ', selected'
        : sourceKeys.has(key)
          ? ', can move'
          : '';
    return `${name}, ${contents === 'empty' ? 'empty' : `${contents} ${checkersWord}`}${tail}`;
  }

  return (
    <svg ref={ref} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className={styles.board} tabIndex={-1}
      role="group" aria-label="Backgammon board">
      <defs>
        <filter id="bg-lift" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>
      <rect width={VIEW_W} height={VIEW_H} rx={14} className={styles.frame} />
      <rect x={FRAME} y={FRAME} width={HALF_W} height={VIEW_H - 2 * FRAME} className={styles.field} />
      <rect x={FRAME + HALF_W + BAR_W} y={FRAME} width={HALF_W} height={VIEW_H - 2 * FRAME} className={styles.field} />
      <rect x={TRAY_X + 6} y={FRAME} width={TRAY_W - 12} height={VIEW_H - 2 * FRAME} rx={8} className={styles.tray} />
      <line x1={TRAY_X + 14} x2={TRAY_X + TRAY_W - 14} y1={VIEW_H / 2} y2={VIEW_H / 2} className={styles.trayDivider} />

      {Array.from({ length: 24 }, (_, i) => {
        const point = i + 1;
        const { column, top } = pointSlot(point);
        const x = columnX(column);
        const baseY = top ? FRAME : VIEW_H - FRAME;
        const tipY = top ? FRAME + POINT_H * 0.92 : VIEW_H - FRAME - POINT_H * 0.92;
        const key = `p${point}`;
        const fillClass = (column + (top ? 1 : 0)) % 2 === 0 ? styles.pointA : styles.pointB;
        return (
          <g key={key}>
            <path d={`M${x + 2} ${baseY} L${x + POINT_W / 2} ${tipY} L${x + POINT_W - 2} ${baseY} Z`} className={fillClass} data-cell />
            {destinationKeys.has(key) && (
              <path d={`M${x + 2} ${baseY} L${x + POINT_W / 2} ${tipY} L${x + POINT_W - 2} ${baseY} Z`} className={styles.glow} />
            )}
            {lastTo.has(key) && <circle cx={x + POINT_W / 2} cy={top ? FRAME - 10 : VIEW_H - FRAME + 10} r={5} className={styles.lastMark} />}
          </g>
        );
      })}

      {destinationKeys.has(`off${mover}`) && (
        <rect
          x={TRAY_X + 6}
          y={mover === 'P1' ? VIEW_H / 2 + 4 : FRAME}
          width={TRAY_W - 12}
          height={VIEW_H / 2 - FRAME - 4}
          rx={8}
          className={styles.trayGlow}
        />
      )}

      {checkers.map((checker) => {
        const { x, y, scale } = position(checker);
        const isTop = checker.index === checker.size - 1;
        const lifted = isTop && checker.key === selectedKey;
        const movable = isTop && sourceKeys.has(checker.key) && selectedKey === null;
        const shaking = isTop && checker.key === shakeKey;
        return (
          <g
            key={shaking ? `${checker.id}-${shake?.key}` : checker.id}
            className={[styles.checker, shaking ? styles.shake : ''].join(' ')}
            style={{ transform: `translate(${x}px, ${y}px) scale(${scale})` }}
          >
            <g className={lifted ? styles.lifted : undefined} filter={lifted ? 'url(#bg-lift)' : undefined}>
              <Checker side={checker.side} />
            </g>
            {movable && <circle r={R + 4} className={styles.movable} />}
          </g>
        );
      })}

      {Object.entries(stacks).map(([key, ids]) => {
        if (!key.startsWith('p') || ids.length <= MAX_STACK) return null;
        const { x, y } = checkerOnPoint(Number(key.slice(1)), MAX_STACK - 1);
        return (
          <text key={`n${key}`} x={x} y={y} className={ids[0].startsWith('i') ? styles.badgeDark : styles.badgeLight}>
            {ids.length}
          </text>
        );
      })}

      {(['P1', 'P2'] as Side[]).map((side) => (
        <text key={side} x={TRAY_X + TRAY_W / 2} y={side === 'P1' ? VIEW_H / 2 + 26 : VIEW_H / 2 - 14} className={styles.trayCount}>
          {stacks[`off${side}`].length} / 15
        </text>
      ))}

      <g>
        {FOCUS_ORDER.map((key) => {
          let box: { x: number; y: number; width: number; height: number };
          if (key.startsWith('p')) {
            const { column, top } = pointSlot(Number(key.slice(1)));
            box = { x: columnX(column), y: top ? FRAME : VIEW_H / 2 + MID_GAP / 2 - 30, width: POINT_W, height: POINT_H + 30 };
          } else if (key.startsWith('bar')) {
            box = { x: BAR_X - BAR_W / 2, y: key === 'barP2' ? FRAME : VIEW_H / 2, width: BAR_W, height: VIEW_H / 2 - FRAME };
          } else {
            box = { x: TRAY_X, y: key === 'offP2' ? FRAME : VIEW_H / 2, width: TRAY_W, height: VIEW_H / 2 - FRAME };
          }
          return (
            <g
              key={key}
              data-location={key}
              role="button"
              tabIndex={key === focusKey ? 0 : -1}
              aria-label={describe(key)}
              className={styles.hit}
              onClick={() => onLocation(locationOf(key))}
              onKeyDown={(event) => onKeyDown(event, key)}
              onFocus={() => setFocusKey(key)}
            >
              <rect {...box} fill="transparent" />
              <rect x={box.x + 3} y={box.y + 3} width={box.width - 6} height={box.height - 6} rx={8} className={styles.focusRing} />
            </g>
          );
        })}
      </g>
    </svg>
  );
});

/** A checker centred on the origin. Obsidian carries a ring so the sides differ by more than colour. */
export function Checker({ side }: { side: Side }) {
  const ivory = side === 'P1';
  return (
    <>
      <circle r={R} cy={3} fill="rgba(0,0,0,0.25)" />
      <circle r={R} fill={ivory ? 'var(--bg-ivory)' : 'var(--bg-obsidian)'} stroke={ivory ? 'var(--bg-ivory-rim)' : 'var(--bg-obsidian-rim)'} strokeWidth={2.5} />
      <circle r={R * 0.62} fill="none" stroke={ivory ? 'var(--bg-ivory-rim)' : 'var(--bg-obsidian-rim)'} strokeWidth={ivory ? 1.5 : 3} />
    </>
  );
}

export function CheckerSwatch({ side }: { side: Side }) {
  return (
    <svg viewBox="-34 -34 68 70" aria-hidden="true">
      <Checker side={side} />
    </svg>
  );
}
