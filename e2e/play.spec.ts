import { expect, test } from '@playwright/test';
import { GAMES, moveItems, playAndAwaitReply, startFromPosition, waitForHumanTurn } from './games';

for (const game of GAMES) {
  test.describe(game.name, () => {
    test('home → game → move → computer replies → restart → home', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('link', { name: new RegExp(game.name) }).first().click();
      await expect(page).toHaveURL(new RegExp(`${game.path}$`));
      await waitForHumanTurn(page);

      await playAndAwaitReply(page, game);

      await page.getByRole('button', { name: 'Restart' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Restart' }).click();
      await expect(page.getByText('No moves yet.')).toBeVisible();

      await page.getByRole('link', { name: 'Home' }).click();
      await expect(page).toHaveURL(/\/$/);
    });

    test('a near-win position ends in the result modal, and Play again starts fresh', async ({ page }) => {
      await startFromPosition(page, game);
      await waitForHumanTurn(page);
      await game.win(page);

      const dialog = page.getByRole('dialog');
      await expect(dialog.getByRole('heading', { name: 'You win' })).toBeVisible();
      await dialog.getByRole('button', { name: 'Play again' }).click();

      await expect(dialog).toBeHidden();
      await waitForHumanTurn(page);
      // A fresh game: at most the computer's opening move.
      await expect.poll(() => moveItems(page).count()).toBeLessThanOrEqual(1);
    });

    test('the game resumes after a refresh', async ({ page }) => {
      await page.goto(game.path);
      await waitForHumanTurn(page);
      await playAndAwaitReply(page, game);
      const count = await moveItems(page).count();
      await page.reload();
      await waitForHumanTurn(page);
      await expect(moveItems(page)).toHaveCount(count);
    });
  });
}
