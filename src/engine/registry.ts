import type { GameType } from '../api/types';
import { backgammonEngine } from './backgammon';
import { backgammonAi } from './backgammonAi';
import { checkersEngine } from './checkers';
import { checkersAi } from './checkersAi';
import { connectFourEngine } from './connectFour';
import { connectFourAi } from './connectFourAi';
import type { AiPlayer, GameEngine } from './core';

/** Everything the referee needs to host one game: its rules and its computer player. */
export interface GameModule {
  engine: GameEngine<unknown, unknown>;
  ai: AiPlayer<unknown, unknown>;
}

const MODULES: Record<GameType, GameModule> = {
  CONNECT_FOUR: { engine: connectFourEngine, ai: connectFourAi } as unknown as GameModule,
  CHECKERS: { engine: checkersEngine, ai: checkersAi } as unknown as GameModule,
  BACKGAMMON: { engine: backgammonEngine, ai: backgammonAi } as unknown as GameModule,
};

export function moduleFor(type: GameType): GameModule {
  const module = MODULES[type];
  if (!module) throw new Error(`Game type ${type} is not available.`);
  return module;
}
