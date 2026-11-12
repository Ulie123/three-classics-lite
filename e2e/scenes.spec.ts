import { expect, test, type Page } from '@playwright/test';
import { GAMES, waitForHumanTurn } from './games';

// Hero props (data-prop="hero") must stay at least half visible: inside the viewport and not hidden
// behind the board, the side panel, the top bar, or on the home page the cards and the title.
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];
const TOP_BAR = 56;
const GRID = 12;

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** For each hero in the full-page scene: its name and the share of a sample grid that is unobstructed. */
async function heroVisibility(page: Page, blockers: string[], topBar: number) {
  return page.evaluate(
    ({ blockers, topBar, grid }) => {
      const rects: Rect[] = blockers.flatMap((selector) =>
        [...document.querySelectorAll(selector)].map((el) => el.getBoundingClientRect()),
      );
      const blocked = (x: number, y: number) =>
        x < 0 ||
        y < topBar ||
        x > window.innerWidth ||
        y > window.innerHeight ||
        rects.some((r) => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height);
      return [...document.querySelectorAll('[data-scene][data-mode="full"] [data-prop="hero"]')].map((hero) => {
        const r = hero.getBoundingClientRect();
        let clear = 0;
        for (let i = 0; i < grid; i++) {
          for (let j = 0; j < grid; j++) {
            if (!blocked(r.x + (r.width * (i + 0.5)) / grid, r.y + (r.height * (j + 0.5)) / grid)) clear++;
          }
        }
        return { name: String(hero.className), visible: clear / (grid * grid), width: r.width };
      });
    },
    { blockers, topBar, grid: GRID },
  );
}

for (const viewport of VIEWPORTS) {
  for (const game of GAMES) {
    test(`${game.name} scene heroes are visible at ${viewport.width}×${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(game.path);
      await waitForHumanTurn(page);

      const heroes = await heroVisibility(page, ['[data-testid="board"]', '[data-testid="panel"]'], TOP_BAR);
      expect(heroes.length).toBeGreaterThan(0);
      for (const hero of heroes) {
        expect(hero.width, hero.name).toBeGreaterThan(0);
        expect(hero.visible, hero.name).toBeGreaterThanOrEqual(0.5);
      }
    });
  }

  test(`home scene heroes are visible at ${viewport.width}×${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const heroes = await heroVisibility(page, ['main header', 'main li'], 0);
    expect(heroes.length).toBeGreaterThan(0);
    for (const hero of heroes) {
      expect(hero.width, hero.name).toBeGreaterThan(0);
      expect(hero.visible, hero.name).toBeGreaterThanOrEqual(0.5);
    }
  });
}
