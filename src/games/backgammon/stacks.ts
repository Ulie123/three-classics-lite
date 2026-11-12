// Gives every checker a stable identity so that moves can slide it from place to place. Identities
// are assigned in a fixed order from a base position, then replayed through the steps since then.
import type { Side } from '../../api/types';
import { toScreenPoint } from './geometry';
import { BAR, OFF, type BackgammonState, type Step } from './types';

/** Stack keys: "p1"…"p24" (P1's numbering), "barP1", "barP2", "offP1", "offP2". */
export type Stacks = Record<string, string[]>;

export interface Placed {
  id: string;
  side: Side;
  key: string;
  index: number;
  /** How many checkers share the stack (for the count badge). */
  size: number;
}

export function initialStacks(state: BackgammonState): Stacks {
  const stacks: Stacks = {};
  let ivory = 0;
  let obsidian = 0;
  const fill = (key: string, side: Side, count: number) => {
    stacks[key] = Array.from({ length: count }, () => (side === 'P1' ? `i${ivory++}` : `o${obsidian++}`));
  };
  fill('barP1', 'P1', state.barP1);
  fill('barP2', 'P2', state.barP2);
  state.points.forEach((count, i) => fill(`p${i + 1}`, count > 0 ? 'P1' : 'P2', Math.abs(count)));
  fill('offP1', 'P1', state.offP1);
  fill('offP2', 'P2', state.offP2);
  return stacks;
}

export function locationKey(location: number, side: Side): string {
  if (location === BAR) return `bar${side}`;
  if (location === OFF) return `off${side}`;
  return `p${toScreenPoint(location, side)}`;
}

/** Plays one step on the stacks: the mover's top checker moves; a hit blot goes to the bar. */
export function replay(stacks: Stacks, side: Side, step: Step): Stacks {
  const next: Stacks = Object.fromEntries(Object.entries(stacks).map(([key, ids]) => [key, [...ids]]));
  const from = locationKey(step.from, side);
  const to = locationKey(step.to, side);
  const moving = next[from].pop();
  if (!moving) return stacks;
  const ownPrefix = side === 'P1' ? 'i' : 'o';
  if (to.startsWith('p') && next[to].length === 1 && !next[to][0].startsWith(ownPrefix)) {
    const opponent: Side = side === 'P1' ? 'P2' : 'P1';
    next[`bar${opponent}`].push(next[to].pop()!);
  }
  next[to].push(moving);
  return next;
}

export function placed(stacks: Stacks): Placed[] {
  const all: Placed[] = [];
  for (const [key, ids] of Object.entries(stacks)) {
    ids.forEach((id, index) => all.push({ id, side: id.startsWith('i') ? 'P1' : 'P2', key, index, size: ids.length }));
  }
  return all;
}
