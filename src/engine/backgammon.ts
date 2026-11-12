import type { Side } from '../api/types';
import type { BackgammonMove, BackgammonState, Notice, Step } from '../games/backgammon/types';
import { BAR, OFF, Position, distinctTurns, legalTurns, turnGraph } from './backgammonPosition';
import { type GameEngine, IllegalMoveError, type Rng, opponent, win } from './core';

/*
 * Backgammon for a single game (no doubling cube), ported from BackgammonEngine.java. Dice are rolled
 * here when a ROLL move is applied; turns that cannot be played pass automatically.
 */

export const CHECKERS = 15;
export const ROLL: BackgammonMove = { kind: 'ROLL', steps: [], dice: null };

const roll = (rng: Rng) => 1 + rng.int(6);
const diceText = (dice: number[]) => `${dice[0]}–${dice[1]}`;

function stepText(step: Step): string {
  const from = step.from === BAR ? 'bar' : String(step.from);
  const to = step.to === OFF ? 'off' : String(step.to);
  return `${from}/${to}${step.hit ? '*' : ''}`;
}

const sameSteps = (a: Step[], b: Step[]) =>
  a.length === b.length &&
  a.every((s, i) => s.from === b[i].from && s.to === b[i].to && s.die === b[i].die && s.hit === b[i].hit);

const sameDice = (a: number[] | null, b: number[] | null | undefined) =>
  a !== null && b != null && a.length === b.length && a.every((die, i) => die === b[i]);

function state(
  from: BackgammonState,
  changes: Partial<BackgammonState> & Pick<BackgammonState, 'sideToMove' | 'phase'>,
): BackgammonState {
  return {
    points: changes.points ?? from.points,
    barP1: changes.barP1 ?? from.barP1,
    barP2: changes.barP2 ?? from.barP2,
    offP1: changes.offP1 ?? from.offP1,
    offP2: changes.offP2 ?? from.offP2,
    sideToMove: changes.sideToMove,
    phase: changes.phase,
    dice: changes.dice ?? from.dice,
    opening: changes.opening === undefined ? from.opening : changes.opening,
    notices: changes.notices ?? [],
    lastTurn: changes.lastTurn === undefined ? from.lastTurn : changes.lastTurn,
  };
}

export function isClosedOut(s: BackgammonState, side: Side): boolean {
  const position = Position.of(s, side);
  if (position.mine[BAR] === 0) return false;
  for (let die = 1; die <= 6; die++) {
    if (position.theirs[BAR - die] < 2) return false;
  }
  return true;
}

/** Pips left for a side: the starting position is 167 each. */
export const pipCount = (s: BackgammonState, side: Side) => Position.of(s, side).pips();

export const backgammonEngine: GameEngine<BackgammonState, BackgammonMove> & {
  /** Puts specific dice on the table, as if they had just been rolled. */
  rollWith(s: BackgammonState, die1: number, die2: number): BackgammonState;
} = {
  initialState() {
    const points = new Array<number>(24).fill(0);
    // Each side: 2 on its 24-point, 5 on 13, 3 on 8, 5 on 6. P2's point q is P1's 25 - q.
    points[23] = 2;
    points[12] = 5;
    points[7] = 3;
    points[5] = 5;
    points[0] = -2;
    points[11] = -5;
    points[16] = -3;
    points[18] = -5;
    return {
      points,
      barP1: 0,
      barP2: 0,
      offP1: 0,
      offP2: 0,
      sideToMove: 'P1',
      phase: 'OPENING',
      dice: [],
      opening: null,
      notices: [],
      lastTurn: null,
    };
  },

  normalize(s) {
    if (!Array.isArray(s.points) || s.points.length !== 24) throw new Error('A backgammon board has 24 points');
    return {
      points: [...s.points],
      barP1: s.barP1 ?? 0,
      barP2: s.barP2 ?? 0,
      offP1: s.offP1 ?? 0,
      offP2: s.offP2 ?? 0,
      sideToMove: s.sideToMove,
      phase: s.phase,
      dice: s.dice ?? [],
      opening: s.opening ?? null,
      notices: s.notices ?? [],
      lastTurn: s.lastTurn ?? null,
    };
  },

  sideToMove: (s) => s.sideToMove,

  legalMoves(s) {
    if (this.outcome(s)) return [];
    if (s.phase !== 'MOVE') return [ROLL];
    return legalTurns(Position.of(s, s.sideToMove), s.dice[0], s.dice[1]).map((steps) => ({
      kind: 'TURN',
      steps,
      dice: s.dice,
    }));
  },

  /** One turn per distinct resulting position; the order of play is in the move graph. */
  clientMoves(s) {
    if (s.phase !== 'MOVE' || this.outcome(s)) return this.legalMoves(s);
    const position = Position.of(s, s.sideToMove);
    return distinctTurns(position, legalTurns(position, s.dice[0], s.dice[1])).map((steps) => ({
      kind: 'TURN',
      steps,
      dice: s.dice,
    }));
  },

  moveGraph(s) {
    if (s.phase !== 'MOVE' || this.outcome(s)) return null;
    const position = Position.of(s, s.sideToMove);
    return turnGraph(position, legalTurns(position, s.dice[0], s.dice[1]));
  },

  apply(s, move, rng) {
    if (this.outcome(s)) throw new IllegalMoveError('The game is already over.');
    if (s.phase === 'MOVE') {
      const legal = move?.kind === 'TURN' && Array.isArray(move.steps)
        ? legalTurns(Position.of(s, s.sideToMove), s.dice[0], s.dice[1])
        : [];
      if (!legal.some((steps) => sameSteps(steps, move.steps)) || !sameDice(s.dice, move.dice)) {
        throw new IllegalMoveError(`That isn't a legal way to play ${diceText(s.dice)}.`);
      }
      const steps = move.steps.map(({ from, to, die, hit }) => ({ from, to, die, hit }));
      return playTurn(s, { kind: 'TURN', steps, dice: [...s.dice] });
    }
    if (move?.kind !== 'ROLL') throw new IllegalMoveError('Roll the dice first.');
    if (s.phase === 'OPENING') return openingRoll(s, rng);
    return this.rollWith(s, roll(rng), roll(rng));
  },

  rollWith(s, die1, die2) {
    const rolled = state(s, { sideToMove: s.sideToMove, phase: 'MOVE', dice: [die1, die2], opening: null });
    return passIfStuck(rolled, []);
  },

  outcome(s) {
    const winner: Side | null = s.offP1 === CHECKERS ? 'P1' : s.offP2 === CHECKERS ? 'P2' : null;
    if (winner === null) return null;
    const loser = Position.of(s, opponent(winner));
    if (loser.mine[OFF] > 0) return win(winner, 'Single game (1 point)', 1);
    // The winner's home board is the loser's points 19–24.
    let trapped = loser.mine[BAR] > 0;
    for (let p = 19; p <= 24; p++) trapped ||= loser.mine[p] > 0;
    return trapped ? win(winner, 'Backgammon (3 points)', 3) : win(winner, 'Gammon (2 points)', 2);
  },

  recorded(before, move, after) {
    if (move.kind !== 'ROLL') return move;
    if (before.phase === 'OPENING') return { kind: 'OPENING', steps: [], dice: after.opening };
    return { kind: 'ROLL', steps: [], dice: after.dice };
  },

  notation(move) {
    if (move.kind === 'ROLL') return move.dice == null ? 'Roll' : `Rolled ${diceText(move.dice)}`;
    if (move.kind === 'OPENING') return `Opening roll ${diceText(move.dice!)}`;
    return `${diceText(move.dice!)}: ${move.steps.map(stepText).join(' ')}`;
  },
};

/** One die each, re-rolling ties; the higher die starts and plays both dice. */
function openingRoll(s: BackgammonState, rng: Rng): BackgammonState {
  let p1: number;
  let p2: number;
  do {
    p1 = roll(rng);
    p2 = roll(rng);
  } while (p1 === p2);
  const starter: Side = p1 > p2 ? 'P1' : 'P2';
  const rolled = state(s, { sideToMove: starter, phase: 'MOVE', dice: [p1, p2], opening: [p1, p2] });
  return passIfStuck(rolled, []);
}

/** If the roll can't be played at all, the turn passes: "No legal moves". */
function passIfStuck(rolled: BackgammonState, notices: Notice[]): BackgammonState {
  if (backgammonEngine.legalMoves(rolled).length > 0) return rolled;
  return handOver(rolled, opponent(rolled.sideToMove), [...notices, { kind: 'NO_MOVES', side: rolled.sideToMove }]);
}

function playTurn(s: BackgammonState, move: BackgammonMove): BackgammonState {
  const mover = s.sideToMove;
  const position = Position.of(s, mover);
  for (const step of move.steps) position.apply(step);
  const played = withPosition(s, position, mover, move);
  if (backgammonEngine.outcome(played)) return played;
  return handOver(played, opponent(mover), []);
}

/**
 * Gives the turn to `next`, who must roll. A player on the bar facing six closed points can't enter
 * at all, so they pass without rolling until a point opens.
 */
function handOver(s: BackgammonState, next: Side, notices: Notice[]): BackgammonState {
  const passed = [...notices];
  let toRoll = next;
  if (isClosedOut(s, next)) {
    passed.push({ kind: 'CLOSED_OUT', side: next });
    toRoll = opponent(next);
  }
  return state(s, { sideToMove: toRoll, phase: 'ROLL', notices: passed });
}

function withPosition(s: BackgammonState, position: Position, mover: Side, move: BackgammonMove): BackgammonState {
  const barMine = position.mine[BAR];
  const offMine = position.mine[OFF];
  const barTheirs = position.theirs[0];
  const p1 = mover === 'P1';
  return state(s, {
    points: position.pointsFor(mover),
    barP1: p1 ? barMine : barTheirs,
    barP2: p1 ? barTheirs : barMine,
    offP1: p1 ? offMine : s.offP1,
    offP2: p1 ? s.offP2 : offMine,
    sideToMove: mover,
    phase: 'MOVE',
    opening: null,
    notices: [],
    lastTurn: move,
  });
}
