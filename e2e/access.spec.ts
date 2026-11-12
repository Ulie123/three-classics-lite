import { expect, test } from '@playwright/test';
import { connectFour, moveItems, startFromPosition, waitForHumanTurn } from './games';

test.describe('keyboard', () => {
  test('Connect Four: arrows choose a column and Enter drops a disc', async ({ page }) => {
    await page.goto('/connect-four');
    await waitForHumanTurn(page);
    await page.getByRole('button', { name: /^Column 4,/ }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('button', { name: /^Column 5,/ })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect.poll(() => moveItems(page).count()).toBeGreaterThanOrEqual(2);
    await expect(moveItems(page).first()).toContainText('Column 5');
  });

  test('Checkers: arrows move between squares and Enter selects and moves', async ({ page }) => {
    await page.goto('/checkers');
    await waitForHumanTurn(page);
    await page.getByRole('button', { name: /^c3,/ }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: /^c3, .*selected/ })).toBeVisible();
    await page.keyboard.press('ArrowUp');
    await expect(page.getByRole('button', { name: /^d4,/ })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect.poll(() => moveItems(page).count()).toBeGreaterThanOrEqual(2);
    await expect(moveItems(page).first()).toContainText('c3–d4');
  });

  test('the result modal traps focus, Esc closes it, and the pill reopens it', async ({ page }) => {
    await startFromPosition(page, connectFour);
    await waitForHumanTurn(page);
    await connectFour.win(page);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: 'Play again' })).toBeFocused();
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
    }
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await page.getByRole('button', { name: 'Show result' }).click();
    await expect(dialog).toBeVisible();
  });

  test('home cards are reached with Tab and opened with Enter', async ({ page }) => {
    await page.goto('/');
    const card = page.getByRole('link', { name: /Checkers$/ });
    for (let i = 0; i < 6 && !(await card.evaluate((node) => node === document.activeElement)); i++) {
      await page.keyboard.press('Tab');
    }
    await expect(card).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/checkers$/);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('scenes stay still when the system asks for less motion', async ({ page }) => {
    for (const path of ['/', '/connect-four', '/checkers', '/backgammon']) {
      await page.goto(path);
      const scenes = page.locator('[data-scene]');
      await expect(scenes.first()).toBeAttached();
      for (const animate of await scenes.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-animate')))) {
        expect(animate).toBe('false');
      }
    }
  });

  test('the setting can turn ambient motion back on', async ({ page }) => {
    await page.goto('/connect-four');
    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('switch', { name: /Ambient motion/ }).click();
    await expect(page.locator('[data-scene]').first()).toHaveAttribute('data-animate', 'true');
  });
});
