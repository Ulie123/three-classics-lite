import { useEffect, useRef, useState } from 'react';
import { Check, Dices, Undo2 } from 'lucide-react';
import type { GameEvent, Side } from '../../api/types';
import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { DesertScene } from '../../themes/desert/DesertScene';
import { GameShell } from '../shared/GameShell';
import { PlayerList, PlayerRow } from '../shared/PlayerList';
import { useGameSession } from '../shared/useGameSession';
import { BackgammonBoard, CheckerSwatch, STEP_MS } from './BackgammonBoard';
import { BackgammonRules } from './BackgammonRules';
import { Dice } from './Dice';
import { VIEW_H, VIEW_W, applyStep, pipCount } from './geometry';
import { isComplete, movableFrom, remainingDice, stepBetween, stepsFrom, type GraphStep } from './turn';
import { OFF, type BackgammonMove, type BackgammonState, type Step, type TurnGraph } from './types';
import styles from './BackgammonPage.module.css';

const sideName = (side: Side) => (side === 'P1' ? 'Ivory' : 'Obsidian');
const swatch = (side: Side) => <CheckerSwatch side={side} />;

export function BackgammonPage() {
  const toast = useToast();
  const boardRef = useRef<SVGSVGElement>(null);
  const session = useGameSession<BackgammonState, BackgammonMove>({
    type: 'BACKGAMMON',
    eventDuration: (event) => (event.move.kind === 'TURN' ? event.move.steps.length * STEP_MS + 220 : 750),
    onEvent: (event) => announce(event),
  });
  const { game, shown, canMove, play, busy } = session;

  const [path, setPath] = useState<number[]>([0]);
  const [steps, setSteps] = useState<GraphStep[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [shake, setShake] = useState<{ location: number; key: number } | null>(null);
  // A new position (or game) starts the turn being built from scratch.
  useEffect(() => {
    setPath([0]);
    setSteps([]);
    setSelected(null);
  }, [game?.id, game?.version]);

  const state = shown?.state ?? null;
  const graph = canMove && state?.phase === 'MOVE' ? (game?.moveGraph as TurnGraph | null) : null;
  const mover = state?.sideToMove ?? 'P1';
  const isHuman = (side: Side) => game?.mode === 'LOCAL' || side === game?.humanSide;
  const humanToRoll = canMove && state !== null && state.phase !== 'MOVE';

  function announce(event: GameEvent<BackgammonState, BackgammonMove>) {
    const messages = event.state.notices.map((notice) => {
      const subject = game?.mode === 'LOCAL' ? sideName(notice.side) : isHuman(notice.side) ? null : 'Computer';
      if (notice.kind === 'NO_MOVES') return subject ? `${subject} has no legal moves — turn passes.` : 'No legal moves — turn passes.';
      return subject ? `${subject} is closed out — turn passes.` : 'Closed out — turn passes.';
    });
    if (messages.length > 0) toast.show(messages.join(' '));
  }

  const sources = graph ? movableFrom(graph, path) : [];
  const destinations = graph && selected !== null ? stepsFrom(graph, path).filter((s) => s.from === selected).map((s) => s.to) : [];
  const complete = graph ? isComplete(graph, path) : false;

  function take(step: GraphStep) {
    if (!graph) return;
    const nextPath = [...path, step.child];
    setPath(nextPath);
    setSteps([...steps, step]);
    // Keep the same checker selected if it can move again.
    const canContinue = step.to !== OFF && stepsFrom(graph, nextPath).some((s) => s.from === step.to);
    setSelected(canContinue ? step.to : null);
  }

  function onLocation(location: number) {
    if (!graph || location < 0) return;
    if (selected !== null) {
      const step = stepBetween(graph, path, selected, location);
      if (step) return take(step);
      if (location === selected) return setSelected(null);
    }
    if (sources.includes(location)) return setSelected(location);
    setShake({ location: selected ?? location, key: Date.now() });
  }

  function undo() {
    setPath(path.slice(0, -1));
    setSteps(steps.slice(0, -1));
    setSelected(null);
  }

  function confirm() {
    if (!state || !complete) return;
    const turn: Step[] = steps.map(({ from, to, die, hit }) => ({ from, to, die, hit }));
    const preview = turn.reduce((s, step) => applyStep(s, mover, step), state);
    play({ kind: 'TURN', steps: turn, dice: state.dice }, preview);
  }

  function roll() {
    play({ kind: 'ROLL', steps: [], dice: null }, undefined, { awaitsReply: false });
  }

  // Dice: blank before the opening roll; four for doubles; used dice dimmed while building.
  const dice = state && state.dice.length === 2 ? state.dice : [0, 0];
  const isDouble = dice[0] !== 0 && dice[0] === dice[1] && !(state?.opening);
  const shownDice = isDouble ? [dice[0], dice[0], dice[0], dice[0]] : dice;
  const active = state?.phase === 'MOVE' ? (graph ? remainingDice(dice, steps) : shownDice.map(() => true)) : shownDice.map(() => false);
  const rolled = shown?.animate && (shown.move?.kind === 'ROLL' || shown.move?.kind === 'OPENING');

  const note = (() => {
    if (!game || !state || game.status !== 'IN_PROGRESS' || busy) return null;
    if (state.phase === 'OPENING') return 'Roll to see who starts.';
    if (state.phase === 'MOVE' && state.opening && steps.length === 0 && canMove) {
      const [ivory, obsidian] = state.opening;
      const starter = game.mode === 'VS_AI' ? 'You start' : `${sideName(mover)} starts`;
      return `${starter}: ${Math.max(ivory, obsidian)} beats ${Math.min(ivory, obsidian)}.`;
    }
    if (graph) return complete ? 'Confirm to finish your turn.' : 'Pick a checker, then a glowing point.';
    return null;
  })();

  const lastTurnEntry = [...(game?.history ?? [])].reverse().find((entry) => entry.move.kind === 'TURN');
  const lastTurn = lastTurnEntry ? { side: lastTurnEntry.side, steps: lastTurnEntry.move.steps } : null;
  const building = graph ? steps : [];
  const display = state ? building.reduce((s, step) => applyStep(s, mover, step), state) : null;

  return (
    <GameShell
      theme="desert"
      title="Backgammon"
      Scene={DesertScene}
      session={session}
      aspect={VIEW_W / VIEW_H}
      boardRef={boardRef}
      sideName={sideName}
      swatch={swatch}
      note={note}
      panel={
        game &&
        display && (
          <PlayerList>
            {(['P1', 'P2'] as Side[]).map((side) => (
              <PlayerRow
                key={side}
                swatch={swatch(side)}
                name={sideName(side)}
                role={game.mode === 'LOCAL' ? (side === 'P1' ? 'Player 1' : 'Player 2') : side === game.humanSide ? 'You' : 'Computer'}
                detail={`${pipCount(display, side)} pips · ${side === 'P1' ? display.offP1 : display.offP2}/15 off`}
                active={game.status === 'IN_PROGRESS' && state?.sideToMove === side}
              />
            ))}
          </PlayerList>
        )
      }
      belowBoard={
        <div className={styles.controls}>
          <Dice
            values={shownDice}
            active={active}
            rollKey={rolled ? (shown?.seq ?? null) : null}
            label={dice[0] ? `Dice: ${dice.join(' and ')}` : 'Dice not rolled yet'}
          />
          <div className={styles.actions}>
            {graph ? (
              <>
                <Button
                  icon={<Undo2 strokeWidth={1.75} size={18} />}
                  onClick={undo}
                  disabled={steps.length === 0}
                  className={styles.undo}
                  aria-label="Undo"
                >
                  Undo
                </Button>
                <Button variant="primary" icon={<Check strokeWidth={1.75} size={18} />} onClick={confirm} disabled={!complete}>
                  Confirm
                </Button>
              </>
            ) : (
              <Button variant="primary" icon={<Dices strokeWidth={1.75} size={18} />} onClick={roll} disabled={!humanToRoll}>
                {state?.phase === 'OPENING' ? 'Roll to start' : 'Roll'}
              </Button>
            )}
          </div>
        </div>
      }
      board={
        shown && (
          <BackgammonBoard
            ref={boardRef}
            shown={shown}
            building={building}
            mover={mover}
            sources={selected === null ? sources : []}
            destinations={destinations}
            selected={selected}
            lastTurn={lastTurn}
            onLocation={onLocation}
            shake={shake}
          />
        )
      }
      rules={<BackgammonRules />}
      flourish="sand"
    />
  );
}
