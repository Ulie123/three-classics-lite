// Walking the server's turn graph: the player builds a turn one checker step at a time, and only
// steps that continue some legal turn are ever offered.
import type { Step, TurnGraph } from './types';

export interface GraphStep extends Step {
  child: number;
}

/** The legal next steps after the given path of graph nodes (path[0] is always node 0). */
export function stepsFrom(graph: TurnGraph, path: number[]): GraphStep[] {
  const node = graph.nodes[path[path.length - 1]];
  return node.steps.map(([from, to, die, hit, child]) => ({ from, to, die, hit: hit === 1, child }));
}

export function isComplete(graph: TurnGraph, path: number[]): boolean {
  return graph.nodes[path[path.length - 1]].complete;
}

/** Locations (mover's numbering, 25 = bar) that have a checker able to move next. */
export function movableFrom(graph: TurnGraph, path: number[]): number[] {
  return [...new Set(stepsFrom(graph, path).map((step) => step.from))];
}

/**
 * The step for moving a checker from one location to another. When several dice reach the same
 * place (bearing off with a 5 or a 6), the smallest is used and the larger saved.
 */
export function stepBetween(graph: TurnGraph, path: number[], from: number, to: number): GraphStep | null {
  const options = stepsFrom(graph, path).filter((step) => step.from === from && step.to === to);
  options.sort((a, b) => a.die - b.die);
  return options[0] ?? null;
}

/** The dice still to be played after the given steps, for dimming used dice. */
export function remainingDice(dice: number[], steps: Step[]): boolean[] {
  const all = dice[0] === dice[1] ? [dice[0], dice[0], dice[0], dice[0]] : [...dice];
  const used = all.map(() => false);
  for (const step of steps) {
    const index = all.findIndex((die, i) => !used[i] && die === step.die);
    if (index >= 0) used[index] = true;
  }
  return used.map((u) => !u);
}
