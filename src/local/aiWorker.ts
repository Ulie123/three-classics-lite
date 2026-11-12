/// <reference lib="webworker" />
import type { Difficulty, GameType } from '../api/types';
import { secureRng } from '../engine/core';
import { moduleFor } from '../engine/registry';

/**
 * Runs the computer players off the main thread, so the board keeps animating while Hard thinks
 * for up to a second.
 */
export interface AiRequest {
  id: number;
  type: GameType;
  state: unknown;
  difficulty: Difficulty;
  budgetMs: number;
}

export type AiResponse = { id: number; move: unknown } | { id: number; error: string };

self.onmessage = (event: MessageEvent<AiRequest>) => {
  const { id, type, state, difficulty, budgetMs } = event.data;
  try {
    const move = moduleFor(type).ai.chooseMove(state, difficulty, secureRng, budgetMs);
    self.postMessage({ id, move } satisfies AiResponse);
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : String(error) } satisfies AiResponse);
  }
};
