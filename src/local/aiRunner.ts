import type { Difficulty, GameType } from '../api/types';
import { secureRng } from '../engine/core';
import { moduleFor } from '../engine/registry';
import type { AiRequest, AiResponse } from './aiWorker';

/** Asks a computer player for its move. */
export type ChooseMove = (type: GameType, state: unknown, difficulty: Difficulty, budgetMs: number) => Promise<unknown>;

/** In the page itself: used by tests, and as a fallback if the worker can't start. */
export const chooseInPage: ChooseMove = async (type, state, difficulty, budgetMs) =>
  moduleFor(type).ai.chooseMove(state, difficulty, secureRng, budgetMs);

let worker: Worker | null = null;
let workerBroken = false;
let nextId = 0;
const pending = new Map<number, { resolve: (move: unknown) => void; reject: (error: Error) => void }>();

function startWorker(): Worker | null {
  if (worker || workerBroken || typeof Worker === 'undefined') return worker;
  try {
    worker = new Worker(new URL('./aiWorker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (event: MessageEvent<AiResponse>) => {
      const waiting = pending.get(event.data.id);
      if (!waiting) return;
      pending.delete(event.data.id);
      if ('error' in event.data) waiting.reject(new Error(event.data.error));
      else waiting.resolve(event.data.move);
    };
    worker.onerror = () => {
      // The worker failed to load: answer what's waiting in the page, and stop using it.
      workerBroken = true;
      worker?.terminate();
      worker = null;
      for (const [, waiting] of pending) waiting.reject(new Error('worker failed'));
      pending.clear();
    };
  } catch {
    workerBroken = true;
    worker = null;
  }
  return worker;
}

/** In a background worker when the browser allows it, otherwise in the page. */
export const chooseInWorker: ChooseMove = (type, state, difficulty, budgetMs) => {
  const background = startWorker();
  if (!background) return chooseInPage(type, state, difficulty, budgetMs);
  const id = ++nextId;
  return new Promise<unknown>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    background.postMessage({ id, type, state, difficulty, budgetMs } satisfies AiRequest);
  }).catch((error: Error) =>
    error.message === 'worker failed' ? chooseInPage(type, state, difficulty, budgetMs) : Promise.reject(error),
  );
};
