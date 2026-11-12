import type { Difficulty, Side } from '../api/types';
import type { CheckersMove, CheckersState } from '../games/checkers/types';
import { SIZE, crowningRow, isKing, moves, owner, play } from './checkers';
import { type AiPlayer, type Rng, now, opponent } from './core';

/*
 * Port of CheckersAi.java. Easy plays a random legal move. Medium searches four plies on material and
 * advancement. Hard runs alpha-beta with iterative deepening inside the budget and a richer evaluation.
 */

const WIN = 100_000;
const MAN = 100;
const KING = 160;
const MEDIUM_DEPTH = 4;
const MEDIUM_TOLERANCE = 6;
/** Extra plies searched past the horizon while captures are pending, so exchanges resolve. */
const CAPTURE_EXTENSION = 6;

class Timeout extends Error {}

/** Negamax with alpha-beta. Scores are from the point of view of the side to move. */
class Search {
  private nodes = 0;

  constructor(
    private readonly deadline: number,
    private readonly rich: boolean,
  ) {}

  negamax(board: string[], side: Side, depth: number, alpha: number, beta: number, ply: number): number {
    if ((++this.nodes & 1023) === 0 && now() > this.deadline) throw new Timeout();
    const legal = moves(board, side);
    if (legal.length === 0) return -WIN + ply; // no pieces or no moves: a loss, the later the better
    const capturing = legal[0].captures.length > 0;
    if (depth <= 0 && !(capturing && depth > -CAPTURE_EXTENSION)) return evaluate(board, side, this.rich);
    let best = -WIN * 2;
    for (const move of legal) {
      const score = -this.negamax(play(board, move), opponent(side), depth - 1, -beta, -alpha, ply + 1);
      if (score > best) best = score;
      if (score > alpha) alpha = score;
      if (alpha >= beta) break;
    }
    return best;
  }
}

/** Static evaluation from `side`'s point of view. */
export function evaluate(board: string[], side: Side, rich: boolean): number {
  let score = 0;
  let mine = 0;
  let theirs = 0;
  let myMaterial = 0;
  let theirMaterial = 0;
  for (let square = 0; square < SIZE * SIZE; square++) {
    const piece = board[square];
    const pieceOwner = owner(piece);
    if (pieceOwner === null) continue;
    const row = Math.floor(square / SIZE);
    const column = square % SIZE;
    const king = isKing(piece);
    let value = king ? KING : MAN;
    if (!king) {
      // Rows advanced toward crowning.
      const advanced = pieceOwner === 'P1' ? SIZE - 1 - row : row;
      value += 3 * advanced;
    }
    if (rich) {
      if (!king && row === SIZE - 1 - crowningRow(pieceOwner)) value += 8; // back-row guard
      if (row >= 2 && row <= 5 && column >= 2 && column <= 5) value += 6; // centre control
    }
    if (pieceOwner === side) {
      score += value;
      mine++;
      myMaterial += king ? KING : MAN;
    } else {
      score -= value;
      theirs++;
      theirMaterial += king ? KING : MAN;
    }
  }
  if (!rich) return score;
  score += 2 * (moves(board, side).length - moves(board, opponent(side)).length);
  if (mine + theirs <= 8 && myMaterial !== theirMaterial) {
    // Endgame: the side ahead brings its kings toward the enemy; the side behind keeps away.
    const sign = myMaterial > theirMaterial ? 1 : -1;
    const leader = sign > 0 ? side : opponent(side);
    score -= sign * kingDistance(board, leader);
  }
  return score;
}

/** Sum over the leader's kings of the distance to the nearest enemy piece. */
function kingDistance(board: string[], leader: Side): number {
  let total = 0;
  for (let a = 0; a < SIZE * SIZE; a++) {
    if (owner(board[a]) !== leader || !isKing(board[a])) continue;
    let nearest = SIZE;
    for (let b = 0; b < SIZE * SIZE; b++) {
      if (owner(board[b]) !== opponent(leader)) continue;
      const distance = Math.max(
        Math.abs(Math.floor(a / SIZE) - Math.floor(b / SIZE)),
        Math.abs((a % SIZE) - (b % SIZE)),
      );
      nearest = Math.min(nearest, distance);
    }
    total += nearest;
  }
  return total;
}

function medium(board: string[], side: Side, legal: CheckersMove[], rng: Rng): CheckersMove {
  const search = new Search(Infinity, false);
  const scores = legal.map(
    (move) => -search.negamax(play(board, move), opponent(side), MEDIUM_DEPTH - 1, -WIN * 2, WIN * 2, 1),
  );
  const best = Math.max(...scores);
  const nearBest = legal.filter((_, i) => scores[i] >= best - MEDIUM_TOLERANCE);
  return nearBest[rng.int(nearBest.length)];
}

function hard(board: string[], side: Side, legal: CheckersMove[], budgetMs: number): CheckersMove {
  const deadline = now() + budgetMs * 0.85;
  const search = new Search(deadline, true);
  let ordered = [...legal];
  let best = ordered[0];
  for (let depth = 1; depth <= 30; depth++) {
    try {
      let alpha = -WIN * 2;
      let bestThisDepth: CheckersMove | null = null;
      const scores: number[] = [];
      for (const move of ordered) {
        const score = -search.negamax(play(board, move), opponent(side), depth - 1, -WIN * 2, -alpha, 1);
        scores.push(score);
        if (bestThisDepth === null || score > alpha) {
          alpha = score;
          bestThisDepth = move;
        }
      }
      best = bestThisDepth!;
      // Search the best moves first next time (a stable sort, like Java's).
      ordered = ordered
        .map((move, i) => ({ move, score: scores[i] }))
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.move);
      if (Math.abs(alpha) >= WIN - 100) break; // forced result
    } catch (error) {
      if (error instanceof Timeout) break;
      throw error;
    }
  }
  return best;
}

export const checkersAi: AiPlayer<CheckersState, CheckersMove> = {
  chooseMove(state: CheckersState, difficulty: Difficulty, rng: Rng, budgetMs: number) {
    const board = [...state.board];
    const side = state.sideToMove;
    const legal = moves(board, side);
    if (legal.length === 0) throw new Error('No legal moves to choose from');
    if (legal.length === 1 || difficulty === 'EASY') return legal[rng.int(legal.length)];
    return difficulty === 'MEDIUM' ? medium(board, side, legal, rng) : hard(board, side, legal, budgetMs);
  },
};
