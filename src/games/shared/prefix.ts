// Multi-step moves (a checkers multi-jump, a backgammon turn) arrive from the server as complete
// sequences of steps. The player builds one click by click; these helpers decide which next step
// is allowed by checking that the steps so far are a prefix of at least one legal sequence.

export type Equals<T> = (a: T, b: T) => boolean;

const same: Equals<unknown> = (a, b) => a === b;

function startsWith<T>(sequence: T[], prefix: T[], equals: Equals<T>): boolean {
  if (prefix.length > sequence.length) return false;
  return prefix.every((step, i) => equals(step, sequence[i]));
}

/** Sequences that begin with the given steps. */
export function matching<T>(sequences: T[][], prefix: T[], equals: Equals<T> = same): T[][] {
  return sequences.filter((sequence) => startsWith(sequence, prefix, equals));
}

/** Every distinct step that can follow the prefix. */
export function nextSteps<T>(sequences: T[][], prefix: T[], equals: Equals<T> = same): T[] {
  const steps: T[] = [];
  for (const sequence of matching(sequences, prefix, equals)) {
    if (sequence.length <= prefix.length) continue;
    const step = sequence[prefix.length];
    if (!steps.some((existing) => equals(existing, step))) steps.push(step);
  }
  return steps;
}

/** The index of the sequence that the prefix completes exactly, or -1. */
export function completedBy<T>(sequences: T[][], prefix: T[], equals: Equals<T> = same): number {
  return sequences.findIndex((sequence) => sequence.length === prefix.length && startsWith(sequence, prefix, equals));
}
