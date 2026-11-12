import type { GameView, Side } from '../../api/types';

/** "You win" / "Computer wins" / "Draw", or "Coral wins" in a two-player game. */
export function resultTitle(game: GameView<unknown, unknown>, sideName: (side: Side) => string): string {
  const winner = game.outcome?.winner ?? null;
  if (!winner) return 'Draw';
  if (game.mode === 'LOCAL') return `${sideName(winner)} wins`;
  return winner === game.humanSide ? 'You win' : 'Computer wins';
}
