import { expect, test, type Page } from '@playwright/test';
import { GAMES, moveItems, waitForHumanTurn } from './games';

const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
];

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function cellRects(page: Page): Promise<Rect[]> {
  return page.locator('[data-testid="board"] [data-cell]').evaluateAll((cells) =>
    cells.map((cell) => {
      const r = cell.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    }),
  );
}

function expectSameRects(a: Rect[], b: Rect[]) {
  expect(a.length).toBe(b.length);
  a.forEach((rect, i) => {
    expect(Math.abs(rect.x - b[i].x)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(rect.y - b[i].y)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(rect.width - b[i].width)).toBeLessThanOrEqual(0.5);
  });
}

for (const game of GAMES) {
  for (const viewport of VIEWPORTS) {
    test(`${game.name} layout at ${viewport.width}×${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(game.path);
      await waitForHumanTurn(page);

      // No scrollbars on the page itself.
      const overflow = await page.evaluate(() => ({
        x: document.documentElement.scrollWidth - window.innerWidth,
        y: document.documentElement.scrollHeight - window.innerHeight,
      }));
      expect(overflow.x).toBeLessThanOrEqual(0);
      expect(overflow.y).toBeLessThanOrEqual(0);

      // The board is fully visible and centred in its column.
      const board = (await page.getByTestId('board').boundingBox())!;
      const column = (await page.getByTestId('board-column').boundingBox())!;
      expect(board.x).toBeGreaterThanOrEqual(0);
      expect(board.y).toBeGreaterThanOrEqual(0);
      expect(board.x + board.width).toBeLessThanOrEqual(viewport.width);
      expect(board.y + board.height).toBeLessThanOrEqual(viewport.height);
      expect(Math.abs(board.x + board.width / 2 - (column.x + column.width / 2))).toBeLessThanOrEqual(2);
      expect(Math.abs(board.y + board.height / 2 - (column.y + column.height / 2))).toBeLessThanOrEqual(2);

      // Every cell is the same size.
      const cells = await cellRects(page);
      expect(cells.length).toBeGreaterThan(0);
      for (const cell of cells) {
        expect(Math.abs(cell.width - cells[0].width)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(cell.height - cells[0].height)).toBeLessThanOrEqual(0.5);
      }

      // Nothing sits on top of the board: sample a grid of points and hit-test them.
      const covered = await page.evaluate((b) => {
        const host = document.querySelector('[data-testid="board"]')!;
        const misses: string[] = [];
        for (const fx of [0.1, 0.5, 0.9]) {
          for (const fy of [0.1, 0.5, 0.9]) {
            const hit = document.elementFromPoint(b.x + b.width * fx, b.y + b.height * fy);
            if (!hit || !host.contains(hit)) misses.push(`${fx},${fy}: ${hit?.tagName}.${hit?.className}`);
          }
        }
        return misses;
      }, board);
      expect(covered).toEqual([]);

      // Cells don't move or resize when a move is played and the computer replies.
      const before = await moveItems(page).count();
      await game.move(page);
      expectSameRects(await cellRects(page), cells);
      await expect.poll(() => moveItems(page).count()).toBeGreaterThanOrEqual(before + 2);
      await waitForHumanTurn(page);
      expectSameRects(await cellRects(page), cells);
      const after = (await page.getByTestId('board').boundingBox())!;
      expect(after).toEqual(board);
    });
  }
}
