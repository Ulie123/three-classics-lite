import { expect, test } from '@playwright/test';
import { GAMES, playAndAwaitReply, startFromPosition, waitForHumanTurn } from './games';

// Refreshes docs/screenshots. Opt-in because it writes into the repo: SCREENSHOTS=1 npx playwright test screenshots
test.skip(!process.env.SCREENSHOTS, 'Set SCREENSHOTS=1 to refresh docs/screenshots');

const OUT = 'docs/screenshots';
const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
];
const slug = (name: string) => name.toLowerCase().replace(/\s+/g, '-');

for (const game of GAMES) {
  for (const viewport of VIEWPORTS) {
    test(`${game.name} at ${viewport.width}×${viewport.height}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(game.path);
      await waitForHumanTurn(page);
      await playAndAwaitReply(page, game);
      await page.mouse.move(0, viewport.height - 1);
      await page.screenshot({ path: `${OUT}/${slug(game.name)}-${viewport.width}x${viewport.height}.png` });
    });
  }

  test(`${game.name} result`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await startFromPosition(page, game);
    await waitForHumanTurn(page);
    await game.win(page);
    await expect(page.getByRole('dialog').getByRole('heading')).toBeVisible();
    await page.waitForTimeout(2400); // let the flourish settle
    await page.screenshot({ path: `${OUT}/${slug(game.name)}-result.png` });
  });
}

test('home', async ({ page }) => {
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/home-${viewport.width}x${viewport.height}.png` });
  }
});

// Each card's thumbnail only animates while hovered; 4.3 s in, the desert tumbleweed is rolling past.
test('home with each card hovered', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  for (const game of GAMES) {
    await page.mouse.move(0, 0);
    await page.getByRole('link', { name: new RegExp(`${game.name}$`) }).hover();
    await page.waitForTimeout(4300);
    await page.screenshot({ path: `${OUT}/home-1440x900-hover-${slug(game.name)}.png` });
  }
});
