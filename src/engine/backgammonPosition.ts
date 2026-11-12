import type { Side } from '../api/types';
import type { BackgammonState, Step, TurnGraph } from '../games/backgammon/types';

/*
 * Port of Position.java, Turns.java and TurnGraph.java: the board from one side's point of view,
 * every legal way to play a roll, and those ways as a graph the client walks one step at a time.
 */

export const BAR = 25;
export const OFF = 0;

/**
 * The board from one side's point of view, mutable, for move generation and search.
 * `mine[p]` and `theirs[p]` count checkers on the mover's point p (1–24). `mine[25]` is the mover's
 * bar and `mine[0]` their borne-off checkers. The opponent's bar is `theirs[0]` (they enter on the
 * mover's low points) and their borne-off checkers are `theirs[25]`.
 */
export class Position {
  constructor(
    readonly mine: number[],
    readonly theirs: number[],
  ) {}

  static of(state: BackgammonState, side: Side): Position {
    const mine = new Array<number>(26).fill(0);
    const theirs = new Array<number>(26).fill(0);
    for (let p = 1; p <= 24; p++) {
      // P1's point p is entry p - 1; P2's point p is P1's point 25 - p, entry 24 - p.
      const count = side === 'P1' ? state.points[p - 1] : -state.points[24 - p];
      if (count > 0) mine[p] = count;
      else theirs[p] = -count;
    }
    mine[BAR] = side === 'P1' ? state.barP1 : state.barP2;
    mine[OFF] = side === 'P1' ? state.offP1 : state.offP2;
    theirs[0] = side === 'P1' ? state.barP2 : state.barP1;
    theirs[25] = side === 'P1' ? state.offP2 : state.offP1;
    return new Position(mine, theirs);
  }

  copy(): Position {
    return new Position([...this.mine], [...this.theirs]);
  }

  /** Points from P1's point of view, signed, for storing back into a state. */
  pointsFor(side: Side): number[] {
    const points = new Array<number>(24).fill(0);
    for (let p = 1; p <= 24; p++) {
      const signed = this.mine[p] - this.theirs[p];
      if (side === 'P1') points[p - 1] = signed;
      else points[24 - p] = -signed;
    }
    // Java stores -0 as 0; keep JSON free of negative zero.
    return points.map((value) => value || 0);
  }

  allHome(): boolean {
    for (let p = 7; p <= BAR; p++) {
      if (this.mine[p] > 0) return false;
    }
    return true;
  }

  /** Every single step a die allows right now. */
  steps(die: number): Step[] {
    const steps: Step[] = [];
    if (this.mine[BAR] > 0) {
      const target = BAR - die;
      if (this.theirs[target] <= 1) steps.push({ from: BAR, to: target, die, hit: this.theirs[target] === 1 });
      return steps;
    }
    const bearingOff = this.allHome();
    for (let p = 24; p >= 1; p--) {
      if (this.mine[p] === 0) continue;
      const target = p - die;
      if (target >= 1) {
        if (this.theirs[target] <= 1) steps.push({ from: p, to: target, die, hit: this.theirs[target] === 1 });
      } else if (bearingOff && (target === 0 || this.isHighest(p))) {
        // Exact roll, or a higher roll from the highest occupied point.
        steps.push({ from: p, to: OFF, die, hit: false });
      }
    }
    return steps;
  }

  private isHighest(point: number): boolean {
    for (let p = point + 1; p <= 6; p++) {
      if (this.mine[p] > 0) return false;
    }
    return true;
  }

  apply(step: Step): void {
    this.mine[step.from]--;
    if (step.to === OFF) {
      this.mine[OFF]++;
      return;
    }
    if (this.theirs[step.to] === 1) {
      this.theirs[step.to] = 0;
      this.theirs[0]++;
    }
    this.mine[step.to]++;
  }

  /** Total pips the mover still has to travel. */
  pips(): number {
    let pips = 0;
    for (let p = 1; p <= BAR; p++) pips += p * this.mine[p];
    return pips;
  }

  /** Pips the opponent still has to travel, in their own numbering. */
  theirPips(): number {
    let pips = 0;
    for (let p = 1; p <= 24; p++) pips += (25 - p) * this.theirs[p];
    return pips + 25 * this.theirs[0];
  }

  /** True once the two armies have passed each other and no hitting is possible. */
  isRace(): boolean {
    let myRearmost = 0;
    for (let p = BAR; p >= 1; p--) {
      if (this.mine[p] > 0) {
        myRearmost = p;
        break;
      }
    }
    if (this.theirs[0] > 0) return false;
    for (let p = 1; p <= 24; p++) {
      if (this.theirs[p] > 0) return myRearmost < p;
    }
    return true;
  }

  key(): string {
    return `${this.mine.join(',')}|${this.theirs.join(',')}`;
  }
}

/**
 * Every legal step sequence, in order of play. A depth-first search tries the dice in both orders
 * (or four times for doubles); then the player must use as many dice as possible, and if only one
 * die can be used and either could be, it must be the larger one. Empty if the roll can't be used.
 */
export function legalTurns(position: Position, die1: number, die2: number): Step[][] {
  const all: Step[][] = [];
  const dice = die1 === die2 ? [die1, die1, die1, die1] : [die1, die2];
  search(position, dice, new Array<boolean>(dice.length).fill(false), [], all);

  const most = all.reduce((max, sequence) => Math.max(max, sequence.length), 0);
  if (most === 0) return [];
  const longest = all.filter((sequence) => sequence.length === most);
  if (most === 1 && die1 !== die2) {
    const larger = Math.max(die1, die2);
    const withLarger = longest.filter((sequence) => sequence[0].die === larger);
    if (withLarger.length > 0) return withLarger;
  }
  return longest;
}

function search(position: Position, dice: number[], used: boolean[], sequence: Step[], out: Step[][]) {
  let moved = false;
  // For doubles every die is the same, so only the first unused one needs trying.
  const doubles = dice.length === 4;
  for (let i = 0; i < dice.length; i++) {
    if (used[i]) continue;
    for (const step of position.steps(dice[i])) {
      moved = true;
      const next = position.copy();
      next.apply(step);
      used[i] = true;
      sequence.push(step);
      search(next, dice, used, sequence, out);
      sequence.pop();
      used[i] = false;
    }
    if (doubles) break;
  }
  if (!moved) out.push([...sequence]);
}

export function resultOf(position: Position, sequence: Step[]): Position {
  const next = position.copy();
  for (const step of sequence) next.apply(step);
  return next;
}

/** The legal sequences with one representative per distinct resulting position. */
export function distinctTurns(position: Position, sequences: Step[][]): Step[][] {
  const byResult = new Map<string, Step[]>();
  for (const sequence of sequences) {
    const key = resultOf(position, sequence).key();
    if (!byResult.has(key)) byResult.set(key, sequence);
  }
  return [...byResult.values()];
}

/**
 * Every legal way to play a roll as a graph. Node 0 is the start of the turn; each node is a distinct
 * intermediate position (with the dice still unused), so the many orders in which doubles can be
 * played share nodes. Every path from node 0 to a `complete` node is a legal turn.
 */
export function turnGraph(start: Position, sequences: Step[][]): TurnGraph {
  const edges: [number, number, number, number, number][][] = [[]];
  const complete: boolean[] = [false];
  const ids = new Map<string, number>();

  for (const sequence of sequences) {
    const position = start.copy();
    let node = 0;
    const used: number[] = [];
    sequence.forEach((step, i) => {
      position.apply(step);
      used.push(step.die);
      const key = `${position.key()}#${[...used].sort((a, b) => a - b).join(',')}`;
      let child = ids.get(key);
      if (child === undefined) {
        child = edges.length;
        ids.set(key, child);
        edges.push([]);
        complete.push(i === sequence.length - 1);
      }
      const known = edges[node].some((e) => e[0] === step.from && e[1] === step.to && e[2] === step.die);
      if (!known) edges[node].push([step.from, step.to, step.die, step.hit ? 1 : 0, child]);
      node = child;
    });
  }
  return { nodes: edges.map((steps, i) => ({ steps, complete: complete[i] })) };
}
