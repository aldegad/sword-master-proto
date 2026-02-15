import { expect, test } from '@playwright/test';

test.describe('Next.js Pages Screenshot', () => {
  test('take screenshots for landing, game and rulebook', async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'ko-KR',
      viewport: { width: 1920, height: 1080 },
    });

    const page = await context.newPage();

    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'screenshots/game-landing-ko.png', fullPage: true });

    await page.click('#lang-toggle');
    await expect(page.getByText('Play Game')).toBeVisible();
    await page.screenshot({ path: 'screenshots/game-landing-en.png', fullPage: true });

    await page.goto('http://localhost:3000/game/');
    await expect(page.getByText('Game Runtime (Pixi.js)')).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'screenshots/game-play-ko.png', fullPage: true });

    await page.goto('http://localhost:3000/rulebook/');
    await expect(page.getByRole('heading', { name: '룰북' })).toBeVisible();
    await page.screenshot({ path: 'screenshots/game-intro-ko.png', fullPage: true });

    await context.close();
  });
});
