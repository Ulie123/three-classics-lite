import { expect, type Locator, type Page } from '@playwright/test';

/** Everything the shared specs need to know about one game. */
export interface GameFixture {
  name: string;
  path: string;
  type: 'CONNECT_FOUR' | 'CHECKERS' | 'BACKGAMMON';
  /** Makes one legal human move (a whole turn). */
  move: (page: Page) => Promise<void>;
  /** A dev-endpoint position one move from a human win, and that winning move. */
  nearWin: { state: unknown; humanSide?: 'P1' | 'P2' };
  win: (page: Page) => Promise<void>;
}

export const connectFour: GameFixture = {
  name: 'Connect Four',
  path: '/connect-four',
  type: 'CONNECT_FOUR',
  move: async (page) => {
    await page.getByRole('button', { name: /^Column 4,/ }).click();
  },
  nearWin: {
    state: {
      columns: [['P1', 'P2'], ['P1', 'P2'], ['P1', 'P2'], [], [], [], []],
      sideToMove: 'P1',
      winningLines: [],
      lastDrop: null,
    },
  },
  win: async (page) => {
    await page.getByRole('button', { name: /^Column 4,/ }).click();
  },
};

/** A 64-square checkers board with the given pieces, squares named as Dark sees them. */
function checkersBoard(pieces: Record<string, string>): string {
  const board = Array(64).fill('.');
  for (const [name, piece] of Object.entries(pieces)) {
    board[(8 - Number(name[1])) * 8 + (name.charCodeAt(0) - 97)] = piece;
  }
  return board.join('');
}

async function clickSquares(page: Page, ...names: string[]) {
  for (const name of names) {
    await page.getByRole('button', { name: new RegExp(`^${name},`) }).click();
  }
}

export const checkers: GameFixture = {
  name: 'Checkers',
  path: '/checkers',
  type: 'CHECKERS',
  move: (page) => clickSquares(page, 'c3', 'd4'),
  nearWin: {
    // Dark takes Light's last piece.
    state: { board: checkersBoard({ c3: 'd', d4: 'l' }), sideToMove: 'P1', quietPlies: 0, positions: null, lastMove: null },
  },
  win: (page) => clickSquares(page, 'c3', 'e5'),
};

/** Rolls if asked, then plays any legal turn by following the board's own hints. */
async function playBackgammonTurn(page: Page) {
  const roll = page.getByRole('button', { name: /^Roll/ });
  const movable = page.getByRole('button', { name: /can move$/ });
  const destination = page.getByRole('button', { name: /move here$/ });
  const confirm = page.getByRole('button', { name: 'Confirm' });
  // The Roll button is swapped for Undo/Confirm after a roll, so never wait on it.
  const canRoll = async () => (await roll.count()) > 0 && (await roll.isEnabled({ timeout: 100 }).catch(() => false));
  const canAct = async () => (await movable.count()) > 0 || (await canRoll());

  await expect.poll(canAct).toBe(true);
  if (await canRoll()) {
    await roll.click();
    await expect.poll(canAct).toBe(true);
    // No legal moves: the turn passed and the computer has already replied.
    if ((await movable.count()) === 0) return;
  }
  for (let i = 0; i < 8 && !(await confirm.isEnabled()); i++) {
    if ((await destination.count()) === 0) await movable.first().click();
    await destination.first().click();
  }
  await confirm.click();
}

export const backgammon: GameFixture = {
  name: 'Backgammon',
  path: '/backgammon',
  type: 'BACKGAMMON',
  move: playBackgammonTurn,
  nearWin: {
    // Ivory's last checker sits on its 1-point; any roll bears it off.
    state: {
      points: Array.from({ length: 24 }, (_, i) => (i === 0 ? 1 : i === 18 ? -15 : 0)),
      barP1: 0,
      barP2: 0,
      offP1: 14,
      offP2: 0,
      sideToMove: 'P1',
      phase: 'ROLL',
      dice: [],
      opening: null,
      notices: [],
      lastTurn: null,
    },
  },
  win: playBackgammonTurn,
};

export const GAMES: GameFixture[] = [connectFour, checkers, backgammon];

export function moveItems(page: Page): Locator {
  return page.getByRole('list', { name: 'Move list' }).getByRole('listitem');
}

/** Plays the fixture's move and waits until the computer has answered and it's the human's turn. */
export async function playAndAwaitReply(page: Page, game: GameFixture) {
  const before = await moveItems(page).count();
  await game.move(page);
  await expect.poll(() => moveItems(page).count()).toBeGreaterThanOrEqual(before + 2);
  await waitForHumanTurn(page);
}

export async function waitForHumanTurn(page: Page) {
  await expect(page.getByTestId('panel').getByText(/^(Your turn|.+ to move)$/)).toBeVisible();
}

/**
 * Creates a game from a custom position and makes the page resume it. The full project used a
 * dev-only endpoint; here the in-browser referee exposes the same call on window.
 */
export async function startFromPosition(page: Page, game: GameFixture) {
  await page.goto('/');
  const id = await page.evaluate(
    async ([type, humanSide, state]) => {
      const result = await window.__threeClassics!.createFromState(
        { type, mode: 'VS_AI', difficulty: 'EASY', humanSide: humanSide ?? undefined },
        state,
      );
      return result.game.id;
    },
    [game.type, game.nearWin.humanSide ?? null, game.nearWin.state] as const,
  );
  await page.evaluate(([type, id]) => localStorage.setItem(`tc.game.${type}`, JSON.stringify(id)), [game.type, id]);
  await page.goto(game.path);
}
