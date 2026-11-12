import type { Difficulty } from '../api/types';
import type { BackgammonMove, BackgammonState, Step } from '../games/backgammon/types';
import { CHECKERS, ROLL } from './backgammon';
import { BAR, OFF, Position, distinctTurns, legalTurns, resultOf } from './backgammonPosition';
import { type AiPlayer, type Rng, now } from './core';

/*
 * Port of BackgammonAi.java. Easy plays a random legal turn. Medium picks the best resulting position
 * by a heuristic (one ply). Hard looks two plies ahead: for each candidate it averages the opponent's
 * best reply over all 21 rolls, and plays greedily once the armies have passed each other.
 */

const MEDIUM_TOLERANCE = 1.5;
const HARD_CANDIDATES = 8;
/** The 21 distinct rolls with their weight out of 36. */
const ROLLS: [number, number, number][] = [];
for (let a = 1; a <= 6; a++) {
  for (let b = a; b <= 6; b++) ROLLS.push([a, b, a === b ? 1 : 2]);
}

/**
 * How good a position is for the side that just moved (higher is better), roughly in units of a
 * point. A race is judged by pips; with contact, the heuristic weighs safety and structure.
 */
export function evaluate(p: Position): number {
  if (p.mine[OFF] === CHECKERS) return 100;
  if (p.theirs[25] === CHECKERS) return -100;
  const pipLead = p.theirPips() - p.pips();
  if (p.isRace()) return pipLead / 8.0 + 0.3 * (p.mine[OFF] - p.theirs[25]);

  let score = pipLead / 15.0;
  score += 1.2 * p.theirs[0] - 1.2 * p.mine[BAR];
  let made = 0;
  let homeMade = 0;
  let run = 0;
  let longestPrime = 0;
  for (let point = 1; point <= 24; point++) {
    if (p.mine[point] >= 2) {
      made++;
      if (point <= 6) homeMade++;
      run++;
      longestPrime = Math.max(longestPrime, run);
    } else {
      run = 0;
    }
  }
  score += 0.25 * made + 0.35 * homeMade + 0.3 * Math.max(0, longestPrime - 1);
  // Home-board strength matters most when the opponent has checkers to bring in.
  score += homeMade * 0.25 * p.theirs[0];
  score -= blotRisk(p);
  score += 0.15 * p.mine[OFF];
  return score;
}

/** Penalty for blots that opposing checkers can hit with a single die (direct shots). */
function blotRisk(p: Position): number {
  let risk = 0;
  for (let point = 1; point <= 24; point++) {
    if (p.mine[point] !== 1) continue;
    let shooters = 0;
    for (let distance = 1; distance <= 6; distance++) {
      const from = point - distance;
      // Opponents move upward in our numbering; their bar sits at 0.
      if (from >= 0 && p.theirs[from] > 0) shooters++;
    }
    if (shooters === 0) continue;
    const exposure = Math.min(1.0, (shooters * 11) / 36.0);
    // A blot hit deep in our own territory costs more pips than one near their side.
    risk += exposure * (0.4 + (25 - point) / 30.0);
  }
  return risk;
}

/** The same position from the opponent's side. */
function flip(p: Position): Position {
  const state: BackgammonState = {
    points: p.pointsFor('P1'),
    barP1: p.mine[BAR],
    barP2: p.theirs[0],
    offP1: p.mine[OFF],
    offP2: p.theirs[25],
    sideToMove: 'P2',
    phase: 'ROLL',
    dice: [],
    opening: null,
    notices: [],
    lastTurn: null,
  };
  return Position.of(state, 'P2');
}

/** Greedy: the best position after the move, chosen at random among near-equal options. */
function medium(position: Position, turns: Step[][], rng: Rng): Step[] {
  const scores = turns.map((turn) => evaluate(resultOf(position, turn)));
  const best = Math.max(...scores);
  const nearBest = turns.filter((_, i) => scores[i] >= best - MEDIUM_TOLERANCE);
  return nearBest[rng.int(nearBest.length)];
}

/**
 * Two-ply expectimax: keep the most promising candidates by the static evaluation, then score each by
 * the opponent's best reply averaged over every roll (doubles weigh 1/36, others 2/36).
 */
function hard(position: Position, turns: Step[][], deadline: number): Step[] {
  const candidates = turns
    .map((turn) => {
      const after = resultOf(position, turn);
      return { turn, after, score: evaluate(after) };
    })
    .sort((a, b) => b.score - a.score); // stable, like Java's sort
  let best = candidates[0].turn;
  if (candidates.length === 1 || (position.isRace() && candidates[0].after.isRace())) {
    return best; // a race is played well greedily
  }

  let bestExpected = -Infinity;
  for (const candidate of candidates.slice(0, HARD_CANDIDATES)) {
    if (candidate.after.mine[OFF] === CHECKERS) return candidate.turn;
    const theirView = flip(candidate.after);
    let expected = 0;
    for (const [a, b, weight] of ROLLS) {
      if (now() > deadline) return best;
      const replies = distinctTurns(theirView, legalTurns(theirView, a, b));
      let theirBest = replies.length === 0 ? evaluate(theirView) : -Infinity;
      for (const reply of replies) theirBest = Math.max(theirBest, evaluate(resultOf(theirView, reply)));
      expected += weight * -theirBest;
    }
    expected /= 36;
    if (expected > bestExpected) {
      bestExpected = expected;
      best = candidate.turn;
    }
  }
  return best;
}

export const backgammonAi: AiPlayer<BackgammonState, BackgammonMove> = {
  chooseMove(state: BackgammonState, difficulty: Difficulty, rng: Rng, budgetMs: number) {
    if (state.phase !== 'MOVE') return ROLL;
    const position = Position.of(state, state.sideToMove);
    const legal = legalTurns(position, state.dice[0], state.dice[1]);
    if (legal.length === 0) throw new Error('No legal turn to choose from');
    const distinct = distinctTurns(position, legal);
    const chosen =
      difficulty === 'EASY'
        ? distinct[rng.int(distinct.length)]
        : difficulty === 'MEDIUM'
          ? medium(position, distinct, rng)
          : hard(position, distinct, now() + budgetMs * 0.85);
    return { kind: 'TURN', steps: chosen, dice: state.dice };
  },
};

/** For tests: the static evaluation of a state for the side to move. */
export const evaluateBackgammon = (state: BackgammonState) => evaluate(Position.of(state, state.sideToMove));
